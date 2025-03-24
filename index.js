const express = require("express");
const ipaddr = require("ipaddr.js");
const app = express();
const port = 3003;

app.use(express.json());
app.use(express.static("public"));

// Helper function to calculate netmask from CIDR bits
function calculateNetmask(bits) {
  const mask = [];
  for (let i = 0; i < 4; i++) {
    const n = Math.min(bits, 8);
    mask.push(256 - Math.pow(2, 8 - n));
    bits -= n;
  }
  return ipaddr.fromByteArray(mask).toString();
}

// Helper function to calculate wildcard bits
function getWildcardBits(netmask) {
  const maskOctets = ipaddr.parse(netmask).toByteArray();
  return maskOctets.map((octet) => 255 - octet).join(".");
}

// Validation helper for IP addresses
function isValidIp(ip) {
  try {
    ipaddr.parse(ip);
    return true;
  } catch (e) {
    return false;
  }
}

// Validation helper for CIDR
function isValidCidr(cidr) {
  try {
    ipaddr.parseCIDR(cidr);
    return true;
  } catch (e) {
    return false;
  }
}

// Section 1: CIDR to IP Range
app.post("/cidr-to-ip", (req, res) => {
  const { cidr } = req.body;

  // Validation
  if (!cidr) {
    return res.status(400).json({ error: "CIDR is required" });
  }
  if (!isValidCidr(cidr)) {
    return res
      .status(400)
      .json({ error: "Invalid CIDR format (e.g., 192.168.1.0/24)" });
  }

  try {
    const [addr, bits] = ipaddr.parseCIDR(cidr);
    const netmask = calculateNetmask(bits);
    const totalHosts = Math.pow(2, 32 - bits);

    const firstIp = addr.toString();
    const firstIpNum = addr
      .toByteArray()
      .reduce((acc, val) => acc * 256 + val, 0);
    const lastIpNum = firstIpNum + totalHosts - 1;
    const lastIp = ipaddr
      .fromByteArray([
        (lastIpNum >> 24) & 255,
        (lastIpNum >> 16) & 255,
        (lastIpNum >> 8) & 255,
        lastIpNum & 255,
      ])
      .toString();

    const result = {
      cidrRange: cidr,
      netmask: netmask,
      wildcardBits: getWildcardBits(netmask),
      firstIp: firstIp,
      firstIpDecimal: firstIpNum,
      lastIp: lastIp,
      lastIpDecimal: lastIpNum,
      totalHosts: totalHosts,
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error processing CIDR" });
  }
});

// Section 2: IP to CIDR
app.post("/ip-to-cidr", (req, res) => {
  const { firstIp, lastIp } = req.body;

  // Validation
  if (!firstIp || !lastIp) {
    return res
      .status(400)
      .json({ error: "Both firstIp and lastIp are required" });
  }
  if (!isValidIp(firstIp)) {
    return res
      .status(400)
      .json({ error: "Invalid firstIp format (e.g., 192.168.1.0)" });
  }
  if (!isValidIp(lastIp)) {
    return res
      .status(400)
      .json({ error: "Invalid lastIp format (e.g., 192.168.1.255)" });
  }

  try {
    const start = ipaddr.parse(firstIp);
    const end = ipaddr.parse(lastIp);
    const startNum = start
      .toByteArray()
      .reduce((acc, val) => acc * 256 + val, 0);
    const endNum = end.toByteArray().reduce((acc, val) => acc * 256 + val, 0);
    if (startNum > endNum) {
      return res
        .status(400)
        .json({ error: "firstIp must be less than or equal to lastIp" });
    }

    const totalHosts = endNum - startNum + 1;
    const cidrBits = 32 - Math.ceil(Math.log2(totalHosts));
    const cidr = `${firstIp}/${cidrBits}`;
    const netmask = calculateNetmask(cidrBits);

    const result = {
      ipRange: `${firstIp} - ${lastIp}`,
      cidrNotation: cidr,
      netmask: netmask,
      totalHosts: totalHosts,
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error processing IP range" });
  }
});

// Section 3: AWS Subnet Calculator
app.post("/aws-subnets", (req, res) => {
  const { cidr, numSubnets } = req.body;

  // Validation
  if (!cidr) {
    return res.status(400).json({ error: "CIDR is required" });
  }
  if (!isValidCidr(cidr)) {
    return res
      .status(400)
      .json({ error: "Invalid CIDR format (e.g., 10.0.0.0/16)" });
  }
  if (!numSubnets || isNaN(numSubnets) || numSubnets <= 0) {
    return res
      .status(400)
      .json({ error: "numSubnets must be a positive number" });
  }

  try {
    const [baseAddr, baseBits] = ipaddr.parseCIDR(cidr);
    const totalHosts = Math.pow(2, 32 - baseBits);
    const numSubnetsNum = parseInt(numSubnets, 10);

    if (totalHosts / numSubnetsNum < 8) {
      return res.status(400).json({ 
        error: "Too many subnets for the given CIDR range" 
      });
    }

    const hostsPerSubnet = totalHosts / numSubnetsNum;
    const subnetBits = 32 - Math.ceil(Math.log2(hostsPerSubnet));
    const subnetSize = Math.pow(2, 32 - subnetBits);
    const awsReserved = 5;

    let subnets = [];
    let currentIpNum = baseAddr
      .toByteArray()
      .reduce((acc, val) => acc * 256 + val, 0);

    for (let i = 0; i < numSubnetsNum; i++) {
      const firstIp = ipaddr
        .fromByteArray([
          (currentIpNum >> 24) & 255,
          (currentIpNum >> 16) & 255,
          (currentIpNum >> 8) & 255,
          currentIpNum & 255,
        ])
        .toString();
      const netmask = calculateNetmask(subnetBits);
      const lastIpNum = currentIpNum + subnetSize - 1;
      const lastIp = ipaddr
        .fromByteArray([
          (lastIpNum >> 24) & 255,
          (lastIpNum >> 16) & 255,
          (lastIpNum >> 8) & 255,
          lastIpNum & 255,
        ])
        .toString();

      subnets.push({
        cidrRange: `${firstIp}/${subnetBits}`,
        netmask: netmask,
        wildcardBits: getWildcardBits(netmask),
        firstIp: firstIp,
        firstIpDecimal: currentIpNum,
        lastIp: lastIp,
        lastIpDecimal: lastIpNum,
        totalHosts: subnetSize,
        usableHosts: subnetSize - awsReserved,
        reservedIps: awsReserved,
      });

      currentIpNum += subnetSize;
    }

    res.json(subnets);
  } catch (error) {
    res.status(500).json({ error: "Server error processing subnets" });
  }
});

app.post("/check-overlap", (req, res) => {
  const { cidrs } = req.body; // Array of CIDRs, e.g., ["192.168.1.0/24", "192.168.1.128/25"]

  if (!Array.isArray(cidrs) || cidrs.length < 2) {
    return res.status(400).json({ error: "At least two CIDRs are required" });
  }
  if (!cidrs.every(isValidCidr)) {
    return res.status(400).json({ error: "All inputs must be valid CIDRs" });
  }

  try {
    const ranges = cidrs.map((cidr) => {
      const [addr, bits] = ipaddr.parseCIDR(cidr);
      const start = addr.toByteArray().reduce((acc, val) => acc * 256 + val, 0);
      const totalHosts = Math.pow(2, 32 - bits);
      return { cidr, start, end: start + totalHosts - 1 };
    });

    const overlaps = [];
    for (let i = 0; i < ranges.length - 1; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (
          ranges[i].start <= ranges[j].end &&
          ranges[j].start <= ranges[i].end
        ) {
          overlaps.push(`${ranges[i].cidr} overlaps with ${ranges[j].cidr}`);
        }
      }
    }

    res.json({ overlaps: overlaps.length ? overlaps : "No overlaps detected" });
  } catch (error) {
    res.status(500).json({ error: "Server error checking overlaps" });
  }
});

// Section 4: Route Summarization
app.post("/summarize-routes", (req, res) => {
  const { cidrs } = req.body;

  if (!Array.isArray(cidrs) || cidrs.length < 2) return res.status(400).json({ error: "At least two CIDRs are required" });
  if (!cidrs.every(isValidCidr)) return res.status(400).json({ error: "All inputs must be valid CIDRs" });

  try {
    const ranges = cidrs.map(cidr => {
      const [addr, bits] = ipaddr.parseCIDR(cidr);
      const start = addr.toByteArray().reduce((acc, val) => acc * 256 + val, 0);
      return { start, end: start + Math.pow(2, 32 - bits) - 1, bits };
    });

    const minStart = Math.min(...ranges.map(r => r.start));
    const maxEnd = Math.max(...ranges.map(r => r.end));
    const totalHosts = maxEnd - minStart + 1;
    const summaryBits = 32 - Math.ceil(Math.log2(totalHosts));
    const summaryBase = ipaddr.fromByteArray([(minStart >> 24) & 255, (minStart >> 16) & 255, (minStart >> 8) & 255, minStart & 255]).toString();

    // Check if summarization is valid (all ranges must align on summary boundary)
    const summaryStart = minStart & (~0 << (32 - summaryBits));
    if (!ranges.every(r => (r.start & (~0 << (32 - summaryBits))) === summaryStart)) {
      return res.status(400).json({ error: "CIDRs cannot be summarized into a single range" });
    }

    const summaryCidr = `${summaryBase}/${summaryBits}`;
    const netmask = calculateNetmask(summaryBits);

    res.json({
      originalCidrs: cidrs,
      summarizedCidr: summaryCidr,
      netmask: netmask,
      totalHosts: Math.pow(2, 32 - summaryBits)
    });
  } catch (error) {
    res.status(500).json({ error: "Server error summarizing routes" });
  }
});

// Section 5: VLAN Subnet Planner
app.post("/vlan-subnets", (req, res) => {
  const { baseCidr, vlans } = req.body;

  if (!baseCidr) return res.status(400).json({ error: "Base CIDR is required" });
  if (!isValidCidr(baseCidr)) return res.status(400).json({ error: "Invalid base CIDR format (e.g., 10.0.0.0/16)" });
  if (!Array.isArray(vlans) || !vlans.length) return res.status(400).json({ error: "VLANs array is required" });
  if (!vlans.every(v => v.name && typeof v.hosts === 'number' && v.hosts > 0)) {
    return res.status(400).json({ error: "Each VLAN must have a name and a positive host count" });
  }

  try {
    const [baseAddr, baseBits] = ipaddr.parseCIDR(baseCidr);
    const totalAvailable = Math.pow(2, 32 - baseBits);
    let currentIpNum = baseAddr.toByteArray().reduce((acc, val) => acc * 256 + val, 0);
    let usedHosts = 0;

    const subnets = vlans.map(vlan => {
      const subnetSize = Math.pow(2, Math.ceil(Math.log2(vlan.hosts + 2))); // +2 for network/broadcast
      const subnetBits = 32 - Math.log2(subnetSize);
      if (usedHosts + subnetSize > totalAvailable) throw new Error("Not enough IPs for all VLANs");

      const firstIp = ipaddr.fromByteArray([(currentIpNum >> 24) & 255, (currentIpNum >> 16) & 255, (currentIpNum >> 8) & 255, currentIpNum & 255]).toString();
      const netmask = calculateNetmask(subnetBits);
      const lastIpNum = currentIpNum + subnetSize - 1;
      const lastIp = ipaddr.fromByteArray([(lastIpNum >> 24) & 255, (lastIpNum >> 16) & 255, (lastIpNum >> 8) & 255, lastIpNum & 255]).toString();

      const subnet = {
        vlanName: vlan.name,
        cidrRange: `${firstIp}/${subnetBits}`,
        netmask: netmask,
        firstIp: firstIp,
        lastIp: lastIp,
        totalHosts: subnetSize,
        usableHosts: subnetSize - 2, // Network and broadcast reserved
      };

      currentIpNum += subnetSize;
      usedHosts += subnetSize;
      return subnet;
    });

    res.json(subnets);
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error planning VLAN subnets" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
