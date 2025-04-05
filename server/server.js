const express = require("express");
const bodyParser = require("body-parser");
const xss = require('xss');
const { body, validationResult } = require("express-validator");
const ipaddr = require("ipaddr.js");
const ipCIDRCalculator = express.Router();

ipCIDRCalculator.use(bodyParser.json());
ipCIDRCalculator.use(bodyParser.urlencoded({ extended: true }));

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
ipCIDRCalculator.post("/cidr-to-ip", 
    [
        body('cidr')
            .notEmpty().withMessage('CIDR is required')
            .isString().withMessage('CIDR must be a string')
            .trim().escape()
            .isLength({ max: 23 }).withMessage('CIDR must be at most 23 characters long')
            .customSanitizer(value => {
                const cleaned = xss(value, {
                    whiteList: {}, 
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ["script"],
                });
                return cleaned.replace(/&#x2F;/g, "/"); 
            })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((err) => err.msg);
            return res.status(400).json({
                error: true,
                message: errorMessages[0],
            });
        }

        const { cidr } = req.body;

        if (!isValidCidr(cidr)) {
            return res.status(400).json({ 
                error: true,
                message: "Invalid CIDR format (192.168.1.0/24)" 
            });
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

            res.status(201).json({
                error: false,
                result: result
            });
        } catch (error) {
            res.status(500).json({ 
                error: true,
                message: "Server error processing CIDR" 
            });
        }
    }
);

// Section 2: IP to CIDR
ipCIDRCalculator.post("/ip-to-cidr", 
    [
        body('firstIp')
            .notEmpty().withMessage('First IP is required')
            .isString().withMessage('First IP must be a string')
            .trim().escape()
            .isLength({ max: 23 }).withMessage('First IP must be at most 23 characters long')
            .customSanitizer(value => {
                const cleaned = xss(value, {
                    whiteList: {}, 
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ["script"],
                });
                return cleaned.replace(/&#x2F;/g, "/"); 
            }),
        body('lastIp')
            .notEmpty().withMessage('Last IP is required')
            .isString().withMessage('Last IP must be a string')
            .trim().escape()
            .isLength({ max: 23 }).withMessage('Last IP must be at most 23 characters long')
            .customSanitizer(value => {
                const cleaned = xss(value, {
                    whiteList: {}, 
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ["script"],
                });
                return cleaned.replace(/&#x2F;/g, "/"); 
            })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((err) => err.msg);
            return res.status(400).json({
                error: true,
                message: errorMessages[0],
            });
        }

        const { firstIp, lastIp } = req.body;

        if (!isValidIp(firstIp)) {
            return res.status(400).json({ 
                error: true,
                message: "Invalid first ip format (192.168.1.0)" 
            });
        }

        if (!isValidIp(lastIp)) {
            return res.status(400).json({ 
                error: true,
                message: "Invalid last ip format (192.168.1.255)" 
            });
        }

        try {
            const start = ipaddr.parse(firstIp);
            const end = ipaddr.parse(lastIp);
            const startNum = start
                .toByteArray()
                .reduce((acc, val) => acc * 256 + val, 0);
            const endNum = end.toByteArray().reduce((acc, val) => acc * 256 + val, 0);

            if (startNum > endNum) {
                return res.status(400).json({ 
                    error: true,
                    message: "First Ip must be less than or equal to lastIp" 
                });
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

            res.status(201).json({
                error: false,
                result: result
            });
        } catch (error) {
            res.status(500).json({ 
                error: true,
                message: "Server error processing IP range" 
            });
        }
    }
);

// Section 3: AWS Subnet Calculator
ipCIDRCalculator.post("/aws-subnets", 
    [
        body('cidr')
            .notEmpty().withMessage('CIDR is required')
            .isString().withMessage('CIDR must be a string')
            .trim().escape()
            .isLength({ max: 23 }).withMessage('CIDR must be at most 23 characters long')
            .customSanitizer(value => {
                const cleaned = xss(value, {
                    whiteList: {}, 
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ["script"],
                });
                return cleaned.replace(/&#x2F;/g, "/"); 
            }),
        body('numSubnets')
            .notEmpty().withMessage('Number of subnet is required')
            .isInt({ min: 1 }).withMessage('Invalid number of subnets')
    ],
    async (req, res) => {
        const { cidr, numSubnets } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((err) => err.msg);
            return res.status(400).json({
                error: true,
                message: errorMessages[0],
            });
        }

        if (!isValidCidr(cidr)) {
            return res.status(400).json({ 
                error: true,
                message: "Invalid CIDR format (10.0.0.0/16)" 
            });
        }

        try {
            const [baseAddr, baseBits] = ipaddr.parseCIDR(cidr);
            const totalHosts = Math.pow(2, 32 - baseBits);
            const numSubnetsNum = parseInt(numSubnets, 10);

            if (totalHosts / numSubnetsNum < 8) {
                return res.status(400).json({ 
                    error: true,
                    message: "Too many subnets for the given CIDR range" 
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

            res.status(201).json({
                error: false,
                subnets: subnets
            });
        } catch (error) {
            res.status(500).json({ 
                error: true,
                message: "Server error processing subnets" 
            });
        }
    }
);

ipCIDRCalculator.post('/aws-subnets-custom', 
    [
        body('cidr')
            .notEmpty().withMessage('CIDR is required')
            .isString().withMessage('CIDR must be a string')
            .trim().escape()
            .isLength({ max: 23 }).withMessage('CIDR must be at most 23 characters long')
            .customSanitizer(value => {
                const cleaned = xss(value, {
                    whiteList: {},
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ['script'],
                });
                return cleaned.replace(/&#x2F;/g, "/"); 
            }),
        body('hosts')
            .notEmpty().withMessage('Host counts are required')
            .isArray({ min: 1 }).withMessage('At least one host count must be provided')
            .custom((hosts) => {
                if (!hosts.every(h => Number.isInteger(h) && h > 0)) {
                    throw new Error('All host counts must be positive integers');
                }
                return true;
            }),
        body('names')
            .optional()
            .isArray().withMessage('Names must be an array')
            .customSanitizer(names => {
                if (!Array.isArray(names)) return [];
                    return names.map(name => 
                        xss(
                            name.trim(),    
                            { 
                                whiteList: {}, 
                                stripIgnoreTag: true, 
                                stripIgnoreTagBody: ['script'] 
                            }
                        ));
            })
    ], 
    async (req, res) => {
        const { cidr, hosts, names = [] } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);
            return res.status(400).json({
                error: true,
                message: errorMessages[0],
            });
        }

        if (!isValidCidr(cidr)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid CIDR format (10.0.0.0/16)'
            });
        }

        try {
            const [baseAddr, baseBits] = ipaddr.parseCIDR(cidr);
            const totalAvailable = Math.pow(2, 32 - baseBits);
            const awsReserved = 5;
            let currentIpNum = baseAddr.toByteArray().reduce((acc, val) => acc * 256 + val, 0);
            let usedHosts = 0;

            const subnets = hosts.map((usableHosts, index) => {
                const minHosts = usableHosts + awsReserved;
                const exponent = Math.ceil(Math.log2(minHosts));
                const subnetSize = Math.pow(2, exponent);
                const subnetBits = 32 - exponent;

                if (usedHosts + subnetSize > totalAvailable) {
                    throw new Error(`Subnet ${index + 1} (requesting ${usableHosts} hosts) exceeds available address space`);
                }

                const firstIp = ipaddr.fromByteArray([
                        (currentIpNum >> 24) & 255,
                        (currentIpNum >> 16) & 255,
                        (currentIpNum >> 8) & 255,
                        currentIpNum & 255,
                    ]).toString();
                const netmask = calculateNetmask(subnetBits);
                const lastIpNum = currentIpNum + subnetSize - 1;
                const lastIp = ipaddr.fromByteArray([
                        (lastIpNum >> 24) & 255,
                        (lastIpNum >> 16) & 255,
                        (lastIpNum >> 8) & 255,
                        lastIpNum & 255,
                    ]).toString();

                const subnet = {
                    name: names[index] || `Subnet ${index + 1}`,
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
                };

                currentIpNum += subnetSize;
                usedHosts += subnetSize;
                return subnet;
            });

            res.status(201).json({
                error: false,
                subnets: subnets
            });
        } catch (error) {
            if (error.message.includes('exceeds available address space')) {
                return res.status(400).json({
                    error: true,
                    message: error.message
                });
            }

            res.status(500).json({
                error: true,
                message: 'Server error processing subnets'
            });
        }
    }
);

ipCIDRCalculator.post("/check-overlap", 
    [
        body("cidrs")
            .isArray({ min: 2 })
            .withMessage("At least two CIDRs are required")
            .custom((cidrs) => {
                if (!cidrs.every(isValidCidr)) {
                    throw new Error("All inputs must be valid CIDRs");
                }
                return true;
            }),
        body("cidrs.*")
            .isString()
            .withMessage("Each CIDR must be a string")
            .trim()
            .escape()
            .customSanitizer(value => {
                const cleaned = xss(value, {
                    whiteList: {},
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ["script"]
                });
                return cleaned.replace(/&#x2F;/g, "/");
            }),
    ],
    async (req, res) => {
        const { cidrs } = req.body; 

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((err) => err.msg);
            return res.status(400).json({
                error: true,
                message: errorMessages[0],
            });
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
                    if ( ranges[i].start <= ranges[j].end && ranges[j].start <= ranges[i].end) {
                        overlaps.push(`${ranges[i].cidr} overlaps with ${ranges[j].cidr}`);
                    }
                }
            }

            res.json({ 
                overlaps: overlaps.length ? overlaps : "No overlaps detected" 
            });
        } catch (error) {
            res.status(500).json({ error: "Server error checking overlaps" });
        }
    }
);

ipCIDRCalculator.post("/summarize-routes", 
    [
        body("cidrs")
            .isArray({ min: 2 })
            .withMessage("At least two CIDRs are required")
            .custom((cidrs) => {
                if (!cidrs.every(isValidCidr)) {
                    throw new Error("All inputs must be valid CIDRs");
                }
                return true;
            }),
        body("cidrs.*")
            .isString()
            .withMessage("Each CIDR must be a string")
            .trim()
            .escape()
            .customSanitizer(value => {
                const cleaned = xss(value, {
                    whiteList: {},
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ["script"]
                });
                return cleaned.replace(/&#x2F;/g, "/");
            }),
    ],
    async (req, res) => {
        const { cidrs } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((err) => err.msg);
            return res.status(400).json({
                error: true,
                message: errorMessages[0],
            });
        }

        try {
            const ranges = cidrs.map((cidr) => {
                const [addr, bits] = ipaddr.parseCIDR(cidr);
                const start = addr.toByteArray().reduce((acc, val) => acc * 256 + val, 0);
                return {
                    start,
                    end: start + Math.pow(2, 32 - bits) - 1,
                    bits,
                };
            });

            ranges.sort((a, b) => a.start - b.start);

            for (let i = 1; i < ranges.length; i++) {
                if (ranges[i].start !== ranges[i - 1].end + 1) {
                    return res.status(400).json({
                        error: true,
                        message: "CIDRs cannot be summarized into a single range (not contiguous)",
                    });
                }
            }

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
                error: false,
                originalCidrs: cidrs,
                summarizedCidr: `${summaryBase}/${summaryBits}`,
                netmask: netmask,
                totalHosts: Math.pow(2, 32 - summaryBits),
            });
        } catch (error) {
            res.status(500).json({ 
                error: true,
                message: "Server error summarizing routes" 
            });
        }
    }
);

module.exports = ipCIDRCalculator;