# ♟️ Stellar Chess3

Real-time online chess platform with betting using CH3S tokens on Stellar blockchain.

![Stellar](https://img.shields.io/badge/Stellar-Soroban-7D00FF)
![FastAPI](https://img.shields.io/badge/FastAPI-009688)
![React](https://img.shields.io/badge/React-61DAFB)

## 🎯 Features

- ♟️ **Real-time Chess:** Instant move synchronization with WebSocket
- 💰 **Blockchain Betting:** Secure betting system with Stellar smart contracts
- 🪙 **CH3S Token:** Play with your own token
- 🎮 **Matchmaking:** Automatic player matching system
- 📊 **ELO Rating:** Player ranking system
- 🔐 **Freighter Wallet:** Easy wallet integration
- 💸 **Auto Payout:** Instant payment when game ends

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   React     │◄────►│   FastAPI    │◄────►│ Soroban Contract│
│  Frontend   │ WS   │   Backend    │ SDK  │   (Stellar)     │
└─────────────┘      └──────────────┘      └─────────────────┘
      │                     │                        │
      │                     │                        │
  Freighter          PostgreSQL/              CH3S Token
   Wallet              SQLite                   + XLM
```

## 🚀 Quick Start

### Requirements

- Python 3.10+
- Node.js 18+
- Freighter Wallet Extension
- Stellar Testnet Account

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/stellar-chess-betting.git
cd stellar-chess-betting
```

2. **Backend setup:**

```bash
cd chess_backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.template .env
# Edit .env (add your contract addresses, admin key)

# Run backend
uvicorn app.main:app --reload
```

3. **Frontend setup:**

```bash
cd frontend
npm install
npm run dev
```

4. **Open in browser:**

```
http://localhost:5173
```

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed installation.

## 📖 Usage

### 1. Create Account

- Connect Freighter Wallet
- Set username and password
- Register!

### 2. Play Game

- Select bet amount in lobby (1, 5, 10, 50 CH3S)
- Click PLAY button
- Auto-match with opponent

### 3. Win!

- Checkmate your opponent
- Receive auto payout (2x bet amount)
- Check transaction on Stellar Explorer

## 🔧 Tech Stack

### Backend
- FastAPI, Python Chess, Stellar SDK, SQLAlchemy, WebSockets, JWT

### Frontend
- React, Vite, Freighter API, React Router, Axios

### Blockchain
- Soroban (Stellar), Rust, CH3S Token


## 🛡️ Security

- ✅ JWT Authentication
- ✅ Stellar keypair encryption
- ✅ Environment variables (.env)
- ✅ CORS protection
- ✅ SQL injection prevention
- ✅ Smart contract validation

## 🐛 Known Issues

- [ ] Draw game payout logic missing
- [ ] No timeout mechanism
- [ ] Not mobile responsive
- [ ] Token balance not displayed in frontend

## 🗺️ Roadmap

- [ ] Mobile responsive design
- [ ] Tournament mode
- [ ] Chat system
- [ ] Spectator mode
- [ ] Game replay
- [ ] Statistics dashboard
- [ ] Leaderboard

## 🤝 Contributing

Contributions welcome!

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/amazing`)
5. Open Pull Request


## 👨‍💻 Developer

**Taylor** - Engineering Student

First betting application on Stellar blockchain.

## 🙏 Thanks

- [Stellar Development Foundation](https://stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [python-chess](https://python-chess.readthedocs.io/)
- [FastAPI](https://fastapi.tiangolo.com/)

CAEPMYIT5COWDREVWX73FN5P5ITXFIMFK2SN2AJJNAIHDDXD4LQXJWQA betting contract 
CDOY7YQJRBIETBS7E6KEDORG4K3SB7GGHKVMXC4KZSQD2ED7CQHHNUUA sale contract

---

**Have fun! ♟️💰**

Questions: [GitHub Issues](https://github.com/yourusername/stellar-chess-betting/issues)
