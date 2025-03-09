<div align="center">
<img src="https://raw.githubusercontent.com/Elagoht/Passenger-Landing/main/public/assets/logo.png" width="192" height="192" />

# Passenger: Self-Hosted Passphrase Manager

*<big>Because your security shouldn't be a passenger in someone else's vehicle.</big>*



[![Docker Compose](https://img.shields.io/badge/Docker-Compose-blue)](https://docs.docker.com/compose/)
  ![Nest.js](https://img.shields.io/badge/Backend-Nest.js-red)
![GitHub Repo stars](https://img.shields.io/github/stars/Elagoht/Passenger-reborn?style=flat)
![GitHub Issues or Pull Requests](https://img.shields.io/github/issues/Elagoht/Passenger-reborn)
![GitHub Issues or Pull Requests](https://img.shields.io/github/issues-pr/Elagoht/Passenger-reborn)
![GitHub License](https://img.shields.io/github/license/Elagoht/Passenger-reborn)

**This repository is the backend of the Passenger project.**
</div>

Passenger is a zero-trust, self-hosted passphrase manager that puts you in complete control of your security. Unlike traditional password managers, Passenger focuses on passphrases (in terms of "words") - longer, more secure combinations of words and characters that provide significantly better protection than single-word passwords.

## Why Passenger?

In a world where data breaches are common, trusting third-party services with your most sensitive credentials is risky. Passenger eliminates this concern by allowing you to host your own passphrase management system on your infrastructure. Access your credentials securely from anywhere while maintaining complete ownership of your data.

## Key Features

### 🔒 Zero-Trust Architecture

- Self-hosted solution that never sends your master passphrase to any server
- All encryption/decryption happens locally on your device
- No tracking, no telemetry, complete privacy

### 📊 Advanced Security Analysis

- Import brute force wordlists from community repositories
- Run local analyses against your stored accounts to identify vulnerable credentials
- Proactively identify weak passphrases before attackers do

### 🔄 Seamless Migration

- Import credentials from popular browsers (Chrome, Firefox) and password managers (1Password, LastPass)
- Export your data in various formats for backup or migration
- Never get locked into a single ecosystem

### 📱 Mobility Without Compromise

- Access your passphrases securely from any device
- Synchronize your credentials without relying on third-party cloud services
- Take your security with you wherever you go

### 🧠 Intelligent Security Features

- Passphrase strength assessment with detailed scoring
- Uniqueness checking to prevent password reuse
- Similarity detection to identify patterns in your credentials
- Tag system for easy organization and identification of sensitive accounts

### 🔍 Breach Detection

- Check if your credentials have been exposed in known data breaches
- Receive alerts about potentially compromised accounts
- Take immediate action to secure affected accounts

## Getting Started with Docker

The easiest way to get started with Passenger is using Docker:

1. Clone the repository:

```bash
git clone https://github.com/Elagoht/passenger-reborn.git
cd passenger-reborn
```

2. Configure your environment variables:

Create a `.env` file respecting the `env.example` file.

3. Build and start the container:

```bash
docker-compose up -d
```

4. Access Passenger at http://localhost:13541

## Security Recommendations

- 🌐 Use a VPN to connect to your server
- 🔑 Use a strong master passphrase that you don't use anywhere else
- 🔄 Keep your server updated with the latest security patches
- 🔒 Consider setting up HTTPS with a reverse proxy like Nginx or Traefik
- 📦 Regularly backup your database
- 🔍 Run periodic security analyses to identify weak credentials

## Why "Passphrases" Instead of "Passwords"?

Traditional passwords (single words with some numbers or special characters) are increasingly vulnerable to modern cracking techniques. Passphrases - longer combinations of words and characters - provide exponentially more security. Passenger is designed with this security-first mindset, encouraging the use of strong passphrases rather than simple passwords.

## Technical Features

- Built with NestJS for a robust, scalable backend
- RESTful API with comprehensive Swagger documentation
- JWT-based authentication
- Prisma ORM for type-safe database access
- Advanced cryptographic functions for secure passphrase storage
- Support for importing custom wordlists for security analysis
- Collection and tag management for organizing credentials
- Comprehensive statistics and security reporting

## Contributing

Contributions are welcome! Whether you're fixing bugs, improving documentation, or proposing new features, your help makes Passenger better for everyone. Please see our [code of conduct](CODE_OF_CONDUCT.md) for more information.

## License

Passenger is licensed under the GPL-3.0 license. See the [LICENSE](LICENSE) file for details.
