#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token};

// Oyunun durumları
#[contracttype]
#[derive(Clone)]
pub enum GameState {
    Waiting,  // 1. Oyuncu oluşturdu, rakip bekleniyor
    Active,   // 2. Oyuncu katıldı, oyun oynanıyor
    Finished, // Oyun bitti, ödül dağıtıldı
}

// Oyun verisi
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
    // Kontratı başlatırken Admin (Website/Server cüzdanı) atanır
    pub fn init(env: Env, admin: Address) {
        env.storage().instance().set(&ADMIN, &admin);
    }

    // 1. OYUNCU: Oyunu kurar ve bahsi yatırır
    // game_id: Websiteden gelen benzersiz ID
    // amount: Bahis miktarı (5 CH3S için 50_000_000 stroop)
    // ttl_ledgers: Oyun süresi (Ledger cinsinden). Örn: 10 dk oyun için ~120 ledger
    pub fn create_game(env: Env, player1: Address, game_id: u64, token: Address, amount: i128, ttl_ledgers: u32) {
        player1.require_auth(); // Oyuncunun onayı şart

        // Bu ID ile oyun var mı kontrol et
        if env.storage().persistent().has(&game_id) {
            panic!("Bu Game ID zaten kullanimda.");
        }

        // Token Transferi: Player1 -> Kontrat
        // NOT: Kullanıcı önceden kontrata 'approve' (onay) vermiş olmalıdır.
        let client = token::Client::new(&env, &token);
        client.transfer_from(&env.current_contract_address(), &player1, &env.current_contract_address(), &amount);

        // Oyun verisini oluştur
        let game = Game {
            player1: player1.clone(),
            player2: None,
            bet_amount: amount,
            token: token.clone(),
            state: GameState::Waiting,
        };

        // Veriyi kaydet
        env.storage().persistent().set(&game_id, &game);

        // TTL Ayarla: Oyun süresinin 2 katı kadar veri saklansın (Extend TTL)
        // Eğer oyun 30 dk ise, veri 60 dk boyunca saklanır.
        // Stellar'da 1 Ledger yaklaşık 5 saniyedir.
        env.storage().persistent().extend_ttl(&game_id, ttl_ledgers * 2, ttl_ledgers * 2);
    }

    // 2. OYUNCU: Oyuna katılır ve bahsi yatırır
    pub fn join_game(env: Env, player2: Address, game_id: u64) {
        player2.require_auth(); // 2. Oyuncunun onayı şart

        let mut game: Game = env.storage().persistent().get(&game_id).expect("Oyun bulunamadi");

        // Oyun bekleme aşamasında mı?
        match game.state {
            GameState::Waiting => {},
            _ => panic!("Bu oyuna su an katilamazsiniz."),
        }

        // Token Transferi: Player2 -> Kontrat
        let client = token::Client::new(&env, &game.token);
        client.transfer_from(&env.current_contract_address(), &player2, &env.current_contract_address(), &game.bet_amount);

        // Oyunu güncelle
        game.player2 = Some(player2);
        game.state = GameState::Active;

        env.storage().persistent().set(&game_id, &game);
    }

    // ADMIN (WEBSITE): Kazananı belirler ve parayı gönderir
    pub fn resolve_game(env: Env, game_id: u64, winner: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).expect("Admin ayarlanmamis");
        admin.require_auth(); // Sadece ADMIN çağırabilir (Backend cüzdanınız)

        let mut game: Game = env.storage().persistent().get(&game_id).expect("Oyun bulunamadi");

        if let GameState::Finished = game.state {
            panic!("Oyun zaten tamamlanmis.");
        }

        // Kazananın oyunculardan biri olduğunu doğrula
        if winner != game.player1 && Some(winner.clone()) != game.player2 {
             panic!("Kazanan bu oyunun bir oyuncusu degil.");
        }

        // Toplam Potu (2 x Bahis) kazanana gönder
        let total_pot = game.bet_amount * 2;
        let client = token::Client::new(&env, &game.token);
        client.transfer(&env.current_contract_address(), &winner, &total_pot);

        // Durumu güncelle
        game.state = GameState::Finished;
        env.storage().persistent().set(&game_id, &game);
    }

    // Yardımcı: Oyun bilgisini okuma
    pub fn get_game(env: Env, game_id: u64) -> Game {
        env.storage().persistent().get(&game_id).expect("Oyun bulunamadi")
    }
}