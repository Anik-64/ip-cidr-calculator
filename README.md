# IP/CIDR Calculator

A web-based tool designed for network engineers to perform IP and CIDR-related calculations, including converting CIDR to IP ranges, IP ranges to CIDR, generating AWS subnets, checking subnet overlaps, and summarizing routes. Built with Node.js, Express, and a responsive Tailwind CSS frontend, this project is optimized for usability and SEO.

## Features

- **CIDR to IP Range**: Convert CIDR notation (e.g., `192.168.1.0/24`) to detailed IP range information (netmask, wildcard bits, first/last IPs, total hosts).
- **IP to CIDR**: Convert an IP range (e.g., `192.168.1.0 - 192.168.1.255`) to its CIDR equivalent.
- **AWS Subnet Calculator**: Generate subnets from a CIDR block, accounting for AWS’s 5 reserved IPs per subnet.
- **Subnet Overlap Checker**: Identify overlaps between multiple CIDR ranges.
- **Route Summarization**: Combine contiguous CIDR blocks into a single summarized CIDR.
- **Real-Time Validation**: Instant feedback on input errors with red borders and messages.
- **SEO Optimized**: Includes metadata, semantic HTML, and keyword-rich content for better search engine visibility.

## Usage

1. **Examples**:
   - **CIDR to IP Range**:
     - Input: `192.168.1.0/24`
     - Output: 
       ```
       CIDR Range: 192.168.1.0/24
       Netmask: 255.255.255.0
       Wildcard Bits: 0.0.0.255
       First IP: 192.168.1.0
       Last IP: 192.168.1.255
       Total Hosts: 256
       ```
   - **IP to CIDR**:
     - Input: `192.168.1.0 - 192.168.1.255`
     - Output: `192.168.1.0/24`
   - **AWS Subnet Calculator**:
     - Input: `10.0.0.0/16`, 4 subnets
     - Output: Four `/18` subnets (e.g., `10.0.0.0/18`, `10.0.64.0/18`, etc.)
   - **Subnet Overlap Checker**:
     - Input: `192.168.1.0/24`, `192.168.1.128/25`
     - Output: "192.168.1.0/24 overlaps with 192.168.1.128/25"
   - **Route Summarization**:
     - Input: `192.168.0.0/24`, `192.168.1.0/24`
     - Output: `192.168.0.0/23`

## Docker Usage

If you prefer to run the application using Docker, follow these steps:

1. **Pull the Docker Image**:
   ```bash
   docker pull beekeeper27/ip-cidr-calculator:v1.0
   ```

2. **Run the Container**:
   ```bash
   docker run -it -d -p 3001:2723 --name=ipcidrcalculator beekeeper27/ip-cidr-calculator:v1.2
   ```
   The application will be accessible at `http://localhost:3001`.

3. **Check Running Containers**:
   ```bash
   docker ps
   ```

4. **Stop the Container**:
   ```bash
   docker stop <container-id>
   ```

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit changes (`git commit -m "Add new feature"`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a pull request.

## Credits

- Built by `Anik Majumder`

## Contact

For questions or feedback, reach out to [anikmajumder303@gmail.com] or open an issue on GitHub.
