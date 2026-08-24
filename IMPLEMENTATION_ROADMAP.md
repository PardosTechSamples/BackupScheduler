# RTL8156 macOS Driver - Implementation Roadmap

This document provides a detailed, step-by-step implementation plan for building a 5Gbps USB Ethernet driver for macOS using DriverKit.

---

## Prerequisites

### 1. Development Environment Setup

```bash
# Required software
- macOS 15.0+ (Sequoia)
- Xcode 16.0+
- Command Line Tools: xcode-select --install
- Apple Developer Account (Team ID for System Extension signing)

# Hardware
- M2 MacBook (or M1/M3)
- RTL8156/RTL8156B USB Ethernet adapter (Sabrent NT-SS5G or similar)
- 5GbE-capable network switch or router
- CAT6 Ethernet cable
```

### 2. Create Xcode Project

```bash
# Open Xcode
File → New → Project → System Extension → Network Extension
Project Name: RTL8156Driver
Organization Identifier: com.yourcompany
Bundle Identifier: com.yourcompany.RTL8156Driver

# Add frameworks to DriverKit target:
- DriverKit.framework
- USBDriverKit.framework
- NetworkingDriverKit.framework
```

### 3. Configure Entitlements

Edit `RTL8156Driver.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.driverkit</key>
    <true/>
    <key>com.apple.developer.driverkit.transport.usb</key>
    <true/>
    <key>com.apple.developer.driverkit.family.networking</key>
    <true/>
    <key>com.apple.developer.driverkit.allow-any-userclient-access</key>
    <true/>
</dict>
</plist>
```

---

## Phase 1: Hardware Detection & USB Communication

### Step 1.1: Info.plist Configuration

Edit `Info.plist` in the DriverKit extension:

```xml
<key>IOKitPersonalities</key>
<dict>
    <key>RTL8156_USBEthernet</key>
    <dict>
        <key>CFBundleIdentifier</key>
        <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
        <key>IOClass</key>
        <string>RTL8156Driver</string>
        <key>IOProviderClass</key>
        <string>IOUSBHostInterface</string>
        <key>IOUserClass</key>
        <string>RTL8156Driver</string>
        <key>idVendor</key>
        <integer>3034</integer> <!-- 0x0BDA = Realtek -->
        <key>idProduct</key>
        <integer>33110</integer> <!-- 0x8156 = RTL8156/RTL8156B -->
        <key>bInterfaceClass</key>
        <integer>255</integer> <!-- Vendor-specific -->
        <key>bInterfaceSubClass</key>
        <integer>0</integer>
        <key>bInterfaceProtocol</key>
        <integer>0</integer>
    </dict>
</dict>
```

**Testing:**
```bash
# Build and install driver
xcodebuild -scheme RTL8156Driver
sudo systemextensionsctl install .../RTL8156Driver.dext

# Verify driver loads
ioreg -l -w 0 | grep RTL8156
# Expected: IOService matching with idVendor=0x0BDA, idProduct=0x8156

# Check logs
log stream --predicate 'subsystem == "com.yourcompany.RTL8156Driver"'
```

### Step 1.2: Create Driver Skeleton

Create `RTL8156Driver.h`:

```cpp
#ifndef RTL8156Driver_h
#define RTL8156Driver_h

#include <Availability.h>
#include <DriverKit/IOService.h>
#include <DriverKit/IOLib.h>
#include <USBDriverKit/IOUSBHostDevice.h>
#include <USBDriverKit/IOUSBHostInterface.h>
#include <USBDriverKit/IOUSBHostPipe.h>
#include <NetworkingDriverKit/IOUserNetworkEthernet.h>

class RTL8156Driver : public IOUserNetworkEthernet
{
public:
    virtual kern_return_t Start(IOService* provider) override;
    virtual kern_return_t Stop(IOService* provider) override;
    
    // USB Communication
    virtual kern_return_t InitializeUSBDevice();
    virtual void FindEndpoints();
    virtual uint32_t OCP_Read(uint16_t type, uint16_t index);
    virtual void OCP_Write(uint16_t type, uint16_t index, uint32_t data);
    
    // Hardware Initialization
    virtual void HardwareReset();
    virtual void PHYInit();
    virtual void ConfigureRxTxAggregation();
    
    // Network Interface
    virtual kern_return_t Enable(IOService* provider) override;
    virtual kern_return_t Disable(IOService* provider) override;
    virtual void TransmitPackets() override;
    virtual void ReceivePackets();
    
private:
    IOUSBHostInterface* fInterface;
    IOUSBHostDevice* fDevice;
    IOUSBHostPipe* fBulkInPipe;
    IOUSBHostPipe* fBulkOutPipe;
    IOUSBHostPipe* fInterruptPipe;
    
    uint8_t fChipVersion;
    uint32_t fLinkSpeed;
    bool fHardwareReady;
};

#endif /* RTL8156Driver_h */
```

Create `RTL8156Driver.cpp`:

```cpp
#include <os/log.h>
#include "RTL8156Driver.h"

#define Log(fmt, ...) os_log(OS_LOG_DEFAULT, "RTL8156: " fmt, ##__VA_ARGS__)

struct RTL8156Driver_IVars {
    IOUSBHostInterface* interface;
    IOUSBHostDevice* device;
    IOUSBHostPipe* bulkInPipe;
    IOUSBHostPipe* bulkOutPipe;
    IOUSBHostPipe* interruptPipe;
    uint8_t chipVersion;
};

kern_return_t
IMPL(RTL8156Driver, Start)
{
    kern_return_t ret;
    
    Log("RTL8156Driver::Start");
    
    ret = Start(provider, SUPERDISPATCH);
    if (ret != kIOReturnSuccess) {
        Log("Super::Start failed: 0x%x", ret);
        return ret;
    }
    
    // Get USB interface
    ivars->interface = OSDynamicCast(IOUSBHostInterface, provider);
    if (!ivars->interface) {
        Log("Provider is not IOUSBHostInterface");
        return kIOReturnError;
    }
    
    ret = ivars->interface->Open(this, 0, nullptr);
    if (ret != kIOReturnSuccess) {
        Log("Failed to open USB interface: 0x%x", ret);
        return ret;
    }
    
    // Get USB device
    ivars->device = ivars->interface->CopyDevice();
    if (!ivars->device) {
        Log("Failed to get USB device");
        return kIOReturnError;
    }
    
    ret = ivars->device->Open(this, 0, nullptr);
    if (ret != kIOReturnSuccess) {
        Log("Failed to open USB device: 0x%x", ret);
        return ret;
    }
    
    // Initialize hardware
    ret = InitializeUSBDevice();
    if (ret != kIOReturnSuccess) {
        Log("Failed to initialize USB device: 0x%x", ret);
        return ret;
    }
    
    Log("RTL8156Driver started successfully");
    return kIOReturnSuccess;
}

kern_return_t
IMPL(RTL8156Driver, Stop)
{
    Log("RTL8156Driver::Stop");
    
    if (ivars->bulkInPipe) ivars->bulkInPipe->Abort();
    if (ivars->bulkOutPipe) ivars->bulkOutPipe->Abort();
    
    if (ivars->interface) {
        ivars->interface->Close(this, 0);
        OSSafeReleaseNULL(ivars->interface);
    }
    
    if (ivars->device) {
        ivars->device->Close(this, 0);
        OSSafeReleaseNULL(ivars->device);
    }
    
    return Stop(provider, SUPERDISPATCH);
}

kern_return_t
IMPL(RTL8156Driver, InitializeUSBDevice)
{
    kern_return_t ret;
    
    // Step 1: Force USB Configuration 1 (vendor-specific mode)
    Log("Setting USB Configuration 1");
    ret = ivars->device->SetConfiguration(1, false);
    if (ret != kIOReturnSuccess) {
        Log("SetConfiguration failed: 0x%x", ret);
        return ret;
    }
    
    // Step 2: Find bulk endpoints
    FindEndpoints();
    
    // Step 3: Read chip version
    uint32_t versionReg = OCP_Read(0xE800, 0xE00C);  // PLA, VERSION
    ivars->chipVersion = (versionReg >> 8) & 0xFF;
    Log("RTL8156 chip version: 0x%02x", ivars->chipVersion);
    
    return kIOReturnSuccess;
}

void
IMPL(RTL8156Driver, FindEndpoints)
{
    const StandardUSB::ConfigurationDescriptor* configDesc;
    ivars->device->CopyConfigurationDescriptor(1, &configDesc);
    
    // Parse interface descriptor for endpoints
    const StandardUSB::InterfaceDescriptor* ifaceDesc = /* ... parse ... */;
    
    for (int i = 0; i < ifaceDesc->bNumEndpoints; i++) {
        const StandardUSB::EndpointDescriptor* epDesc = /* ... parse ... */;
        
        uint8_t epAddr = epDesc->bEndpointAddress;
        uint8_t epType = epDesc->bmAttributes & 0x03;
        
        if (epType == kUSBBulk) {
            if (epAddr & 0x80) {
                // Bulk IN
                ivars->interface->CopyPipe(epAddr, &ivars->bulkInPipe);
                Log("Found Bulk IN pipe: 0x%02x", epAddr);
            } else {
                // Bulk OUT
                ivars->interface->CopyPipe(epAddr, &ivars->bulkOutPipe);
                Log("Found Bulk OUT pipe: 0x%02x", epAddr);
            }
        } else if (epType == kUSBInterrupt && (epAddr & 0x80)) {
            // Interrupt IN
            ivars->interface->CopyPipe(epAddr, &ivars->interruptPipe);
            Log("Found Interrupt pipe: 0x%02x", epAddr);
        }
    }
}

uint32_t
IMPL(RTL8156Driver, OCP_Read)
{
    StandardUSB::DeviceRequest request;
    request.bmRequestType = makeDeviceRequestbmRequestType(
        kRequestDirectionIn, kRequestTypeVendor, kRequestRecipientDevice);
    request.bRequest = 0x05;  // RTL8152_REQ_GET_REGS
    request.wValue = type;
    request.wIndex = index;
    request.wLength = 4;
    
    uint32_t data = 0;
    uint32_t bytesTransferred = 0;
    
    kern_return_t ret = ivars->device->DeviceRequest(
        this, request, &data, sizeof(data), &bytesTransferred, 5000, nullptr);
    
    if (ret != kIOReturnSuccess) {
        Log("OCP_Read failed at 0x%04x:0x%04x: 0x%x", type, index, ret);
        return 0;
    }
    
    return data;
}

void
IMPL(RTL8156Driver, OCP_Write)
{
    StandardUSB::DeviceRequest request;
    request.bmRequestType = makeDeviceRequestbmRequestType(
        kRequestDirectionOut, kRequestTypeVendor, kRequestRecipientDevice);
    request.bRequest = 0x05;  // RTL8152_REQ_SET_REGS
    request.wValue = type;
    request.wIndex = index | 0x8000;  // Write flag
    request.wLength = 4;
    
    uint32_t bytesTransferred = 0;
    
    kern_return_t ret = ivars->device->DeviceRequest(
        this, request, &data, sizeof(data), &bytesTransferred, 5000, nullptr);
    
    if (ret != kIOReturnSuccess) {
        Log("OCP_Write failed at 0x%04x:0x%04x: 0x%x", type, index, ret);
    }
}
```

**Testing:**
```bash
# Rebuild and reinstall
xcodebuild clean build
sudo systemextensionsctl uninstall <TeamID> com.yourcompany.RTL8156Driver
sudo systemextensionsctl install .../RTL8156Driver.dext

# Plug in RTL8156 adapter
# Check logs for "RTL8156Driver started successfully"
log show --predicate 'subsystem == "com.yourcompany.RTL8156Driver"' --last 1m
```

---

## Phase 2: Hardware Initialization

### Step 2.1: Define Register Constants

Create `RTL8156_Registers.h`:

```cpp
#ifndef RTL8156_Registers_h
#define RTL8156_Registers_h

// MCU Types (OCP address spaces)
#define MCU_TYPE_PLA    0xE800
#define MCU_TYPE_USB    0xE400
#define MCU_TYPE_PHY    0xE000

// PLA Registers (Physical Layer Access)
#define PLA_VERSION     0xE00C
#define PLA_TCR0        0xE610  // TX Control Register 0
#define PLA_TCR1        0xE612
#define PLA_RCR         0xE630  // RX Control Register
#define PLA_CONFIG5     0xE658
#define PLA_PHY_PWR     0xE6D4
#define PLA_MAC_PWR     0xE6E8

// USB Registers
#define USB_RX_BUF_TH   0xD408  // RX buffer threshold
#define USB_TX_AGG      0xD40A  // TX aggregation config
#define USB_RX_AGG      0xD40C  // RX aggregation config
#define USB_USB_CTRL    0xD406
#define USB_USB_TIMER   0xD428

// TCR0 bits (TX Control)
#define TCR0_TX_EMPTY       (1 << 11)
#define TCR0_AUTO_FIFO      (1 << 7)

// RCR bits (RX Control)
#define RCR_AAP             (1 << 0)  // Accept all packets
#define RCR_APM             (1 << 1)  // Accept physical match
#define RCR_AM              (1 << 2)  // Accept multicast
#define RCR_AB              (1 << 3)  // Accept broadcast
#define RCR_ACPT_FLOW       (1 << 12) // Accept flow control frames

// TX/RX Descriptor bits
#define TX_FS               (1 << 31)  // First segment
#define TX_LS               (1 << 30)  // Last segment
#define TX_TCPCS            (1 << 16)  // TCP checksum offload
#define TX_UDPCS            (1 << 17)  // UDP checksum offload
#define TX_IPV6CS           (1 << 28)  // IPv6 checksum

#define RX_LEN_MASK         0x0000FFFF
#define RX_TCPCS_VALID      (1 << 22)
#define RX_UDPCS_VALID      (1 << 21)
#define RX_IPV4CS_VALID     (1 << 20)

// Chip versions
#define RTL8156A_VERSION    0x3100
#define RTL8156B_VERSION    0x3200

#endif
```

### Step 2.2: Implement Hardware Reset

Add to `RTL8156Driver.cpp`:

```cpp
void
IMPL(RTL8156Driver, HardwareReset)
{
    Log("Performing hardware reset");
    
    // Disable RX/TX
    OCP_Write(MCU_TYPE_PLA, PLA_RCR, 0);
    OCP_Write(MCU_TYPE_PLA, PLA_TCR0, 0);
    
    // Wait for TX FIFO to empty
    for (int i = 0; i < 100; i++) {
        uint32_t tcr0 = OCP_Read(MCU_TYPE_PLA, PLA_TCR0);
        if (tcr0 & TCR0_TX_EMPTY) break;
        IOSleep(1);
    }
    
    // Power cycle PHY
    OCP_Write(MCU_TYPE_PLA, PLA_PHY_PWR, 0x0001);  // Power down
    IOSleep(100);
    OCP_Write(MCU_TYPE_PLA, PLA_PHY_PWR, 0x0000);  // Power up
    IOSleep(500);
    
    Log("Hardware reset complete");
}

void
IMPL(RTL8156Driver, PHYInit)
{
    Log("Initializing PHY");
    
    // Enable auto-negotiation for 10/100/1000/2500/5000 Mbps
    // (Detailed PHY register programming from r8152.c goes here)
    
    // For RTL8156, enable 2.5G/5G modes
    // This requires complex PHY register sequences - see r8152_hw_phy_cfg()
    
    Log("PHY initialization complete");
}

void
IMPL(RTL8156Driver, ConfigureRxTxAggregation)
{
    Log("Configuring RX/TX aggregation");
    
    // RX buffer threshold: 48KB aggregation window
    OCP_Write(MCU_TYPE_USB, USB_RX_BUF_TH, 0x7A12);
    
    // TX aggregation: enable batching
    OCP_Write(MCU_TYPE_USB, USB_TX_AGG, 0x0007);
    
    // RX aggregation timeout: 400us
    OCP_Write(MCU_TYPE_USB, USB_RX_AGG, 0x0008);
    
    Log("Aggregation configured");
}
```

**Testing:**
```bash
# After rebuild/reinstall, verify in logs:
# "Hardware reset complete"
# "PHY initialization complete"
# "Aggregation configured"
```

---

## Phase 3: Network Interface Registration

### Step 3.1: Implement IOUserNetworkEthernet Methods

Add to `RTL8156Driver.cpp`:

```cpp
kern_return_t
IMPL(RTL8156Driver, Enable)
{
    kern_return_t ret;
    
    Log("Enabling network interface");
    
    ret = Enable(provider, SUPERDISPATCH);
    if (ret != kIOReturnSuccess) return ret;
    
    // Hardware setup
    HardwareReset();
    PHYInit();
    ConfigureRxTxAggregation();
    
    // Enable RX
    uint32_t rcr = RCR_APM | RCR_AM | RCR_AB | RCR_ACPT_FLOW;
    OCP_Write(MCU_TYPE_PLA, PLA_RCR, rcr);
    
    // Enable TX
    uint32_t tcr0 = TCR0_AUTO_FIFO;
    OCP_Write(MCU_TYPE_PLA, PLA_TCR0, tcr0);
    
    // Start RX polling
    ReceivePackets();
    
    Log("Network interface enabled");
    return kIOReturnSuccess;
}

kern_return_t
IMPL(RTL8156Driver, Disable)
{
    Log("Disabling network interface");
    
    // Stop RX/TX
    OCP_Write(MCU_TYPE_PLA, PLA_RCR, 0);
    OCP_Write(MCU_TYPE_PLA, PLA_TCR0, 0);
    
    // Abort USB transfers
    if (ivars->bulkInPipe) ivars->bulkInPipe->Abort();
    if (ivars->bulkOutPipe) ivars->bulkOutPipe->Abort();
    
    return Disable(provider, SUPERDISPATCH);
}

kern_return_t
IMPL(RTL8156Driver, SetMacAddress)
{
    // Read factory MAC from EEPROM (OCP register 0xE000)
    uint8_t mac[6];
    for (int i = 0; i < 3; i++) {
        uint32_t word = OCP_Read(MCU_TYPE_PLA, 0xE000 + i * 2);
        mac[i * 2] = word & 0xFF;
        mac[i * 2 + 1] = (word >> 8) & 0xFF;
    }
    
    Log("MAC Address: %02x:%02x:%02x:%02x:%02x:%02x",
        mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    
    // Report to Skywalk
    SetMacAddress(mac);
    
    return kIOReturnSuccess;
}
```

**Testing:**
```bash
# Check System Preferences → Network
# Should see new Ethernet interface (enX)
ifconfig -a | grep "en.*: flags"
# Verify MAC address matches device
```

---

## Phase 4: Packet Transmission (TX)

### Step 4.1: Implement TX Path

Add to `RTL8156Driver.cpp`:

```cpp
struct rtl8152_tx_desc {
    uint32_t opts1;
    uint32_t opts2;
} __attribute__((packed));

void
IMPL(RTL8156Driver, TransmitPackets)
{
    IOUserNetworkPacketQueue* txQueue = GetPacketTransmitQueue();
    IOUserNetworkPacket* packet;
    
    while (txQueue->dequeuePacket(&packet) == kIOReturnSuccess) {
        // Allocate TX buffer
        IOBufferMemoryDescriptor* txBuffer;
        IOBufferMemoryDescriptor::Create(
            kIOMemoryDirectionOut,
            sizeof(rtl8152_tx_desc) + packet->getDataLength(),
            0, &txBuffer);
        
        // Build TX descriptor
        rtl8152_tx_desc* desc = (rtl8152_tx_desc*)txBuffer->getBytesNoCopy();
        desc->opts1 = packet->getDataLength() | TX_FS | TX_LS;
        desc->opts2 = 0;
        
        // Enable hardware checksum offload
        uint32_t csumFlags = packet->getChecksumOffloadFlags();
        if (csumFlags & kChecksumTCP) desc->opts2 |= TX_TCPCS;
        if (csumFlags & kChecksumUDP) desc->opts2 |= TX_UDPCS;
        if (csumFlags & kChecksumIPv6) desc->opts2 |= TX_IPV6CS;
        
        // Copy packet data
        uint8_t* payloadPtr = (uint8_t*)desc + sizeof(rtl8152_tx_desc);
        packet->getDataBuffer()->readBytes(0, payloadPtr, packet->getDataLength());
        
        // Submit USB bulk OUT transfer
        ivars->bulkOutPipe->AsyncIO(
            txBuffer,
            0,  // offset
            txBuffer->getLength(),
            &TxComplete,
            this,
            0);  // timeout
        
        packet->release();
    }
}

void
RTL8156Driver::TxComplete(void* target, void* parameter, IOReturn status, uint32_t bytesTransferred)
{
    RTL8156Driver* driver = (RTL8156Driver*)target;
    
    if (status != kIOReturnSuccess) {
        Log("TX error: 0x%x", status);
    }
    
    // Signal TX completion to Skywalk
    driver->ReportTransmitCompletion();
}
```

**Testing:**
```bash
# Assign IP address
sudo ifconfig en<X> 192.168.1.100 netmask 255.255.255.0

# Try pinging local gateway
ping -c 5 192.168.1.1

# Check TX statistics
netstat -I en<X>
```

---

## Phase 5: Packet Reception (RX)

### Step 5.1: Implement RX Path

Add to `RTL8156Driver.cpp`:

```cpp
struct rtl8152_rx_desc {
    uint32_t opts1;
    uint32_t opts2;
    uint32_t opts3;
    uint32_t opts4;
    uint32_t opts5;
    uint32_t opts6;
} __attribute__((packed));

void
IMPL(RTL8156Driver, ReceivePackets)
{
    // Allocate 48KB RX buffer (for aggregated packets)
    IOBufferMemoryDescriptor* rxBuffer;
    IOBufferMemoryDescriptor::Create(
        kIOMemoryDirectionIn,
        48 * 1024,
        0, &rxBuffer);
    
    // Submit continuous USB bulk IN transfer
    ivars->bulkInPipe->AsyncIO(
        rxBuffer,
        0,
        rxBuffer->getLength(),
        &RxComplete,
        this,
        0);
}

void
RTL8156Driver::RxComplete(void* target, void* parameter, IOReturn status, uint32_t bytesTransferred)
{
    RTL8156Driver* driver = (RTL8156Driver*)target;
    IOBufferMemoryDescriptor* rxBuffer = (IOBufferMemoryDescriptor*)parameter;
    
    if (status != kIOReturnSuccess) {
        Log("RX error: 0x%x", status);
        // Resubmit RX transfer
        driver->ReceivePackets();
        return;
    }
    
    // Parse aggregated RX buffer
    uint8_t* buffer = (uint8_t*)rxBuffer->getBytesNoCopy();
    uint32_t offset = 0;
    
    IOUserNetworkPacketQueue* rxQueue = driver->GetPacketReceiveQueue();
    
    while (offset < bytesTransferred) {
        rtl8152_rx_desc* desc = (rtl8152_rx_desc*)(buffer + offset);
        uint32_t pktLen = desc->opts1 & RX_LEN_MASK;
        
        if (pktLen == 0 || pktLen > 9000) break;  // Invalid packet
        
        // Allocate Skywalk packet
        IOUserNetworkPacket* packet;
        rxQueue->allocatePacket(&packet);
        
        // Copy packet data
        uint8_t* payloadPtr = buffer + offset + sizeof(rtl8152_rx_desc);
        packet->getDataBuffer()->writeBytes(0, payloadPtr, pktLen);
        packet->setDataLength(pktLen);
        
        // Set hardware checksum status
        if (desc->opts3 & RX_TCPCS_VALID) {
            packet->setChecksumOffloadFlags(kChecksumTCPValid);
        }
        if (desc->opts3 & RX_UDPCS_VALID) {
            packet->setChecksumOffloadFlags(kChecksumUDPValid);
        }
        
        // Enqueue to Skywalk
        rxQueue->enqueuePacket(packet);
        
        // Move to next packet (8-byte aligned)
        offset += sizeof(rtl8152_rx_desc) + pktLen;
        offset = (offset + 7) & ~7;
    }
    
    // Flush RX queue to network stack
    driver->ReportReceiveCompletion();
    
    // Resubmit RX transfer
    driver->ReceivePackets();
}
```

**Testing:**
```bash
# Test basic connectivity
ping -c 10 192.168.1.1

# Test throughput with iperf3
# On server: iperf3 -s
# On Mac: iperf3 -c <server-ip>

# Expected at this stage: 500-1000 Mbps (still slow, no aggregation yet)
```

---

## Phase 6: Performance Optimization

### Step 6.1: Optimize USB Transfer Sizes

```cpp
// Increase RX buffer count for pipelining
#define RX_BUFFER_COUNT 8

struct RTL8156Driver_IVars {
    IOBufferMemoryDescriptor* rxBuffers[RX_BUFFER_COUNT];
    uint32_t activeRxCount;
};

void
IMPL(RTL8156Driver, Enable)
{
    // ... existing code ...
    
    // Submit multiple RX transfers in parallel
    for (int i = 0; i < RX_BUFFER_COUNT; i++) {
        IOBufferMemoryDescriptor::Create(
            kIOMemoryDirectionIn,
            48 * 1024,
            0, &ivars->rxBuffers[i]);
        
        ivars->bulkInPipe->AsyncIO(
            ivars->rxBuffers[i],
            0,
            48 * 1024,
            &RxComplete,
            this,
            i);  // buffer index as context
    }
}
```

### Step 6.2: Enable TSO (TCP Segmentation Offload)

```cpp
kern_return_t
IMPL(RTL8156Driver, Enable)
{
    // ... existing code ...
    
    // Configure hardware TSO
    OCP_Write(MCU_TYPE_PLA, PLA_TCR0, TCR0_AUTO_FIFO | (1 << 6));  // TSO enable
    
    // Report TSO capability to Skywalk
    IOUserNetworkFeatures features;
    features.hardwareChecksumIPv4 = true;
    features.hardwareChecksumTCP = true;
    features.hardwareChecksumUDP = true;
    features.tsoIPv4 = true;
    features.tsoIPv6 = true;
    features.maximumTransmitSegmentSize = 65536;
    SetFeatures(&features);
}
```

**Testing:**
```bash
# Test with large transfers
iperf3 -c <server> -t 60 -i 5

# Expected: 3000-4000 Mbps

# Check TSO is active
netstat -s | grep "tcp.*segment"
# Should see large segment counts
```

---

## Phase 7: Stability & Power Management

### Step 7.1: Implement Link Status Monitoring

```cpp
void
IMPL(RTL8156Driver, MonitorLinkStatus)
{
    // Poll PHY status via interrupt endpoint
    IOBufferMemoryDescriptor* statusBuffer;
    IOBufferMemoryDescriptor::Create(kIOMemoryDirectionIn, 8, 0, &statusBuffer);
    
    ivars->interruptPipe->AsyncIO(
        statusBuffer, 0, 8,
        &InterruptComplete, this, 0);
}

void
RTL8156Driver::InterruptComplete(void* target, void* parameter, IOReturn status, uint32_t bytesTransferred)
{
    RTL8156Driver* driver = (RTL8156Driver*)target;
    
    // Read link status from hardware
    uint32_t phyStatus = driver->OCP_Read(MCU_TYPE_PLA, PLA_PHYSTATUS);
    
    bool linkUp = (phyStatus & 0x01) != 0;
    uint32_t speed = (phyStatus >> 2) & 0x07;
    
    uint64_t linkSpeedBps = 0;
    switch (speed) {
        case 0x05: linkSpeedBps = 5000000000ULL; break;   // 5 Gbps
        case 0x04: linkSpeedBps = 2500000000ULL; break;   // 2.5 Gbps
        case 0x03: linkSpeedBps = 1000000000ULL; break;   // 1 Gbps
        case 0x02: linkSpeedBps = 100000000ULL; break;    // 100 Mbps
        case 0x01: linkSpeedBps = 10000000ULL; break;     // 10 Mbps
    }
    
    if (linkUp) {
        Log("Link UP: %llu Mbps", linkSpeedBps / 1000000);
        driver->ReportLinkStatus(kIONetworkLinkValid | kIONetworkLinkActive, linkSpeedBps);
    } else {
        Log("Link DOWN");
        driver->ReportLinkStatus(kIONetworkLinkValid, 0);
    }
    
    // Resubmit interrupt transfer
    driver->MonitorLinkStatus();
}
```

### Step 7.2: Implement Sleep/Wake

```cpp
kern_return_t
IMPL(RTL8156Driver, SetPowerState)
{
    if (powerState == kIOPMPowerOff) {
        Log("Entering sleep");
        
        // Disable RX/TX
        OCP_Write(MCU_TYPE_PLA, PLA_RCR, 0);
        OCP_Write(MCU_TYPE_PLA, PLA_TCR0, 0);
        
        // Enable Wake-on-LAN (optional)
        OCP_Write(MCU_TYPE_PLA, PLA_CONFIG5, 0x0001);
        
    } else if (powerState == kIOPMPowerOn) {
        Log("Waking from sleep");
        
        // Re-initialize hardware
        HardwareReset();
        PHYInit();
        ConfigureRxTxAggregation();
        
        // Restart RX
        ReceivePackets();
    }
    
    return kIOReturnSuccess;
}
```

**Testing:**
```bash
# Test sleep/wake
sudo pmset sleepnow
# Wait 10 seconds, wake Mac
# Check network is still working
ping -c 5 192.168.1.1
```

---

## Phase 8: User Installation App

### Step 8.1: Create SwiftUI Installer

Create new macOS App target in Xcode: `RTL8156DriverInstaller`

`ContentView.swift`:

```swift
import SwiftUI
import SystemExtensions

struct ContentView: View {
    @State private var isInstalled = false
    @State private var statusMessage = "Ready to install"
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "network")
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            Text("RTL8156 5Gbps Ethernet Driver")
                .font(.title)
            
            Text(statusMessage)
                .foregroundColor(.gray)
            
            Button(action: installDriver) {
                Text(isInstalled ? "Reinstall Driver" : "Install Driver")
                    .frame(width: 200)
            }
            .buttonStyle(.borderedProminent)
            .disabled(statusMessage.contains("Installing"))
            
            if isInstalled {
                Text("✓ Driver installed successfully!")
                    .foregroundColor(.green)
                Text("Reconnect your USB Ethernet adapter")
                    .font(.caption)
            }
        }
        .padding(40)
        .frame(width: 400, height: 300)
    }
    
    func installDriver() {
        statusMessage = "Installing..."
        
        let request = OSSystemExtensionRequest.activationRequest(
            forExtensionWithIdentifier: "com.yourcompany.RTL8156Driver",
            queue: .main
        )
        request.delegate = DriverInstallDelegate(
            onSuccess: {
                isInstalled = true
                statusMessage = "Installation complete"
            },
            onFailure: { error in
                statusMessage = "Installation failed: \(error)"
            }
        )
        OSSystemExtensionManager.shared.submitRequest(request)
    }
}

class DriverInstallDelegate: NSObject, OSSystemExtensionRequestDelegate {
    let onSuccess: () -> Void
    let onFailure: (String) -> Void
    
    init(onSuccess: @escaping () -> Void, onFailure: @escaping (String) -> Void) {
        self.onSuccess = onSuccess
        self.onFailure = onFailure
    }
    
    func request(_ request: OSSystemExtensionRequest, didFinishWithResult result: OSSystemExtensionRequest.Result) {
        onSuccess()
    }
    
    func request(_ request: OSSystemExtensionRequest, didFailWithError error: Error) {
        onFailure(error.localizedDescription)
    }
    
    func requestNeedsUserApproval(_ request: OSSystemExtensionRequest) {
        print("User approval required - check System Preferences")
    }
}
```

**Testing:**
```bash
# Build installer app
xcodebuild -scheme RTL8156DriverInstaller

# Run installer
open RTL8156DriverInstaller.app

# Click "Install Driver"
# Approve in System Preferences → Privacy & Security
```

---

## Phase 9: Final Testing & Validation

### Test Suite

```bash
# 1. Basic connectivity
ping -c 100 192.168.1.1

# 2. Throughput (should see 4.5-5 Gbps)
iperf3 -c <server> -t 60 -P 4

# 3. Jumbo frames (if supported)
sudo ifconfig en<X> mtu 9000
ping -s 8972 -c 10 192.168.1.1

# 4. Stress test (24 hours)
iperf3 -c <server> -t 86400

# 5. Sleep/wake cycles
for i in {1..10}; do
    sudo pmset sleepnow
    sleep 30
    ping -c 5 192.168.1.1
done

# 6. Check for kernel panics
log show --predicate 'messageType == fault' --last 1d
```

---

## Distribution

### Code Signing

```bash
# Sign DriverKit extension
codesign --force --sign "Developer ID Application" \
    --entitlements RTL8156Driver.entitlements \
    RTL8156Driver.dext

# Sign installer app
codesign --force --sign "Developer ID Application" \
    RTL8156DriverInstaller.app

# Notarize for Gatekeeper
xcrun notarytool submit RTL8156DriverInstaller.zip \
    --apple-id <id> --team-id <team> --password <app-password>
```

### Release Package

```
RTL8156Driver-v1.0/
    RTL8156DriverInstaller.app
    README.md
    LICENSE
    firmware/
        rtl8156b-2.fw
```

---

## Troubleshooting

### Driver doesn't load
```bash
# Check entitlements
codesign -d --entitlements - RTL8156Driver.dext

# Check system extension status
systemextensionsctl list

# Force unload/reload
sudo systemextensionsctl uninstall <TeamID> com.yourcompany.RTL8156Driver
sudo systemextensionsctl reset
```

### Network interface doesn't appear
```bash
# Check USB device is detected
ioreg -p IOUSB -l -w 0 | grep -i rtl

# Check driver claimed device
ioreg -l | grep RTL8156Driver

# Check for USB configuration issues
log show --predicate 'subsystem == "com.apple.DriverKit"' --last 5m
```

### Slow performance (<2 Gbps)
```bash
# Check USB link speed
system_profiler SPUSBDataType | grep -A 10 "RTL"
# Should say "Speed: Up to 5 Gb/s"

# Check aggregation is enabled
# Add debug logging to OCP_Read(USB_RX_AGG)

# Check TSO is active
sysctl net.inet.tcp.tso
# Should be 1
```

---

## Success Criteria Checklist

- [ ] Driver loads and claims RTL8156 USB device
- [ ] Network interface appears in System Preferences
- [ ] Basic connectivity: ping, ssh, web browsing
- [ ] Throughput: >4 Gbps with iperf3
- [ ] CPU usage: <15% of one core at full speed
- [ ] Jumbo frames: MTU 9000 works
- [ ] Stability: 24+ hours continuous operation
- [ ] Power management: Survives sleep/wake
- [ ] User installation: One-click app

---

## Resources

- **AQC111Driver source:** https://github.com/jquirke/AQC111Driver
- **Linux r8152 driver:** https://github.com/torvalds/linux/blob/master/drivers/net/usb/r8152.c
- **Apple DriverKit docs:** https://developer.apple.com/documentation/driverkit
- **NetworkingDriverKit sample:** https://developer.apple.com/documentation/networkingdriverkit
