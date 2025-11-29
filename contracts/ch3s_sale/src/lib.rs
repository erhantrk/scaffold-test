#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, token};

#[contract]
pub struct Ch3sSaleContract;

#[contractimpl]
impl Ch3sSaleContract {
    // Kontratı başlat: Satılacak token (CH3S), Ödeme tokenı (XLM) ve Fiyat (Rate)
    pub fn init(e: Env, ch3s_token: Address, xlm_token: Address, price: i128) {
        e.storage().instance().set(&symbol_short!("CH3S"), &ch3s_token);
        e.storage().instance().set(&symbol_short!("XLM"), &xlm_token);
        e.storage().instance().set(&symbol_short!("PRICE"), &price); // 1 XML kaç CH3S eder? (veya tam tersi mantık kurulabilir)
    }

    // Kullanıcı XLM öder, CH3S alır
    // amount_ch3s: Kullanıcının almak istediği ch3s miktarı
    pub fn buy(e: Env, buyer: Address, amount_ch3s: i128) {
        buyer.require_auth(); // Alıcının izni şart

        let ch3s_addr: Address = e.storage().instance().get(&symbol_short!("CH3S")).unwrap();
        let xlm_addr: Address = e.storage().instance().get(&symbol_short!("XLM")).unwrap();
        let price: i128 = e.storage().instance().get(&symbol_short!("PRICE")).unwrap();

        // Ödenecek XLM miktarını hesapla: (İstenen CH3S * Fiyat)
        // Örnek: Fiyat 2 ise, 10 CH3S almak için 20 XLM ödenmeli.
        let total_xlm_cost = (amount_ch3s * price) / 10_000_000;

        // 1. Kullanıcıdan XLM al (Kontratın kendisine)
        let xlm_client = token::Client::new(&e, &xlm_addr);
        xlm_client.transfer(&buyer, &e.current_contract_address(), &total_xlm_cost);

        // 2. Kullanıcıya ch3s gönder
        let ch3s_client = token::Client::new(&e, &ch3s_addr);
        ch3s_client.transfer(&e.current_contract_address(), &buyer, &amount_ch3s);
    }
    
    // Admin bakiyeyi çekmek isterse diye yardımcı fonksiyon
    pub fn withdraw(e: Env, admin: Address, token: Address, amount: i128) {
        admin.require_auth();
        let client = token::Client::new(&e, &token);
        client.transfer(&e.current_contract_address(), &admin, &amount);
    }
}
// CC5XI7JTQREZVTHCSDE5HWFHXBKYXY7TIRLJ66V2KEANTOM622FVCDND CH3S SAC id'si
// /Users/erhanturker/Stellar/scaffold-test/target/wasm32v1-none/release/ch3s_sale.wasm
// CD4UQBQPGCLBCNGH5R5TRJM7QSM3WXQYFUWI63BTLXD76XR2OBSGK3HD contact
// GB756P3BHL22Y52PDRCMHJQVJPPKC5US3EHGLVTWM74DHG2ND33XOXHM issuer
// CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4 XLM SAC