module letsmovesui::letsmovesui_nft {
    use std::string::String;
    use sui::object::{Self, UID,ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;

    struct LetsMoveSUI_NFT has key {
        id: UID,
        name: String,
        description: String,
        image: String,
        owner: address
    }

    struct LetsMoveSUICap has key {
        id: UID,
    }


    struct LetsMoveSUI_NFT_Minted has copy, drop{
        letsMoveSUI_id: ID,
        minted_by: address,
    }

    fun init(ctx: &mut TxContext) {
        let nft_cap = LetsMoveSUICap {
            id: object::new(ctx),
        };
        transfer::transfer(nft_cap, tx_context::sender(ctx))
    }

    public entry fun mint_nft(_: &mut LetsMoveSUICap, name: String, description: String, image: String, ctx: &mut TxContext)  {
        let owner = tx_context::sender(ctx);
        let nft = LetsMoveSUI_NFT {
            id: object::new(ctx),
            name: name,
            description: description,
            image: image,
            owner: owner
        };
        event::emit(LetsMoveSUI_NFT_Minted {
            letsMoveSUI_id: object::uid_to_inner(&nft.id),
            minted_by: tx_context::sender(ctx),
        });
        transfer::transfer(nft, owner);
    }
}
