const express = require("express");
const ipaddr = require("ipaddr.js");
const ipCIDRCalculator = express.Router();

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
ipCIDRCalculator.post("/cidr-to-ip", (req, res) => {
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
ipCIDRCalculator.post("/ip-to-cidr", (req, res) => {
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
ipCIDRCalculator.post("/aws-subnets", (req, res) => {
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

ipCIDRCalculator.post("/check-overlap", (req, res) => {
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

ipCIDRCalculator.post("/summarize-routes", (req, res) => {
    const { cidrs } = req.body;

    // Input validation
    if (!Array.isArray(cidrs) || cidrs.length < 2) {
        return res.status(400).json({ error: "At least two CIDRs are required" });
    }
    if (!cidrs.every(isValidCidr)) {
        return res.status(400).json({ error: "All inputs must be valid CIDRs" });
    }

    try {
        // Convert CIDRs to numeric ranges
        const ranges = cidrs.map((cidr) => {
        const [addr, bits] = ipaddr.parseCIDR(cidr);
        const start = addr.toByteArray().reduce((acc, val) => acc * 256 + val, 0);
        return {
            start,
            end: start + Math.pow(2, 32 - bits) - 1,
            bits,
        };
        });

        // Sort ranges by start address
        ranges.sort((a, b) => a.start - b.start);

        // Check contiguity
        for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].start !== ranges[i - 1].end + 1) {
            return res.status(400).json({
            error:
                "CIDRs cannot be summarized into a single range (not contiguous)",
            });
        }
        }

        // Calculate summary CIDR
        const minStart = ranges[0].start;
        const maxEnd = ranges[ranges.length - 1].end;
        const totalHosts = maxEnd - minStart + 1;
        const summaryBits = 32 - Math.ceil(Math.log2(totalHosts));
        const summaryBase = ipaddr
        .fromByteArray([
            (minStart >> 24) & 255,
            (minStart >> 16) & 255,
            (minStart >> 8) & 255,
            minStart & 255,
        ])
        .toString();

        const netmask = calculateNetmask(summaryBits);

        res.json({
        originalCidrs: cidrs,
        summarizedCidr: `${summaryBase}/${summaryBits}`,
        netmask: netmask,
        totalHosts: Math.pow(2, 32 - summaryBits),
        });
    } catch (error) {
        res.status(500).json({ error: "Server error summarizing routes" });
    }
});

module.exports = ipCIDRCalculator;