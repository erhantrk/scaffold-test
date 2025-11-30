#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token};

// Game states
#[contracttype]
#[derive(Clone)]
pub enum GameState {
    Waiting,  // 1. Player created, waiting for opponent
    Active,   // 2. Player joined, game in progress
    Finished, // Game finished, payout done
}

// Game data
#[contracttype]
#[derive(Clone)]
pub struct Game {
    pub player1: Address,
    pub player2: Option<Address>,
    pub bet_amount: i128,
    pub token: Address,
    pub state: GameState,
}

#[contract]
pub struct ChessBettingContract;

const ADMIN: Symbol = symbol_short!("ADMIN");

#[contractimpl]
impl ChessBettingContract {
    pub fn init(env: Env, admin: Address) {
        env.storage().instance().set(&ADMIN, &admin);
    }

    // 1. PLAYER: Creates game and places bet
    pub fn create_game(env: Env, player1: Address, game_id: u64, token: Address, amount: i128, ttl_ledgers: u32) {
        player1.require_auth(); // Player1 authorization required

        if env.storage().persistent().has(&game_id) {
            panic!("This Game ID is already in use.");
        }

        // FIX: Use `transfer` instead of `transfer_from`
        // Since player1 authorized this call (require_auth above), 
        // they implicitly authorize the transfer of their own tokens.
        let client = token::Client::new(&env, &token);
        client.transfer(&player1, &env.current_contract_address(), &amount);

        let game = Game {
            player1: player1.clone(),
            player2: None,
            bet_amount: amount,
            token: token.clone(),
            state: GameState::Waiting,
        };

        env.storage().persistent().set(&game_id, &game);
        // Extend TTL to ensure game data survives
        env.storage().persistent().extend_ttl(&game_id, ttl_ledgers * 2, ttl_ledgers * 2);
    }

    // 2. PLAYER: Joins game and places bet
    pub fn join_game(env: Env, player2: Address, game_id: u64) {
        player2.require_auth(); // Player2 authorization required

        let mut game: Game = env.storage().persistent().get(&game_id).expect("Game not found");

        match game.state {
            GameState::Waiting => {},
            _ => panic!("Cannot join this game right now."),
        }

        // FIX: Use `transfer` here as well
        let client = token::Client::new(&env, &game.token);
        client.transfer(&player2, &env.current_contract_address(), &game.bet_amount);

        game.player2 = Some(player2);
        game.state = GameState::Active;

        env.storage().persistent().set(&game_id, &game);
    }

    // ADMIN (WEBSITE): Resolves game and sends payout
    pub fn resolve_game(env: Env, game_id: u64, winner: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).expect("Admin not set");
        admin.require_auth(); 

        let mut game: Game = env.storage().persistent().get(&game_id).expect("Game not found");

        if let GameState::Finished = game.state {
            panic!("Game is already finished.");
        }

        if winner != game.player1 && Some(winner.clone()) != game.player2 {
             panic!("Winner is not a player in this game.");
        }

        let total_pot = game.bet_amount * 2;
        let client = token::Client::new(&env, &game.token);
        // Contract sends tokens to winner (no auth needed for contract to spend its own funds)
        client.transfer(&env.current_contract_address(), &winner, &total_pot);

        game.state = GameState::Finished;
        env.storage().persistent().set(&game_id, &game);
    }

    pub fn get_game(env: Env, game_id: u64) -> Game {
        env.storage().persistent().get(&game_id).expect("Game not found")
    }
}