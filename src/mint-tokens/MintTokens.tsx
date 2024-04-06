import {
  ConnectButton,
  StandardWalletAdapter,
  useWalletKit,
} from "@mysten/wallet-kit";
import { TransactionBlock, formatAddress } from "@mysten/sui.js";
import { useState } from "react";
import {
  CHARGE_FEES,
  CONTRACT_ADDRESS,
  DARK_THEME_STYLES,
  EXPLORER_URL,
  FEE_ADDR,
} from "../consts";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import {
  State,
  RpcState,
  TreasuryCapMap,
  resetTreasuryCap,
  fetchAllTreasuryCaps,
  suiClient,
} from "../store";

export function MintTokens() {
  const { isConnected, currentAccount } = useWalletKit();
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  // if there's an error, we print it and give the user a retry button
  const lastTreasuryLoadingError = useSelector<State, string | undefined>(
    (state) => state.treasuryCap.lastError
  );

  return (
    <div>
      <h2 id="mint-tokens">
        <img
          src="img/detective-duck.64x64.png"
          width={32}
          alt="Detective duck logo"
        />
        &nbsp;&nbsp;Mint NFT
      </h2>

      {lastTreasuryLoadingError ? (
        <span style={{ color: "red" }}>{lastTreasuryLoadingError}</span>
      ) : (
        <></>
      )}

      <div>
        <label htmlFor="token-name">Name:</label>&nbsp;&nbsp;
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="NFT Name"
          name="token-name"
          id="token-name"
          aria-label="token-name"
        />
      </div>
      <div>
        <label htmlFor="token-icon-url">Icon image URL:</label>&nbsp;&nbsp;
        <input
          type="text"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          placeholder="https://www.circle.com/hubfs/usdcoin-ondark.svg"
          name="token-icon-url"
          id="token-icon-url"
          aria-label="token-icon-url"
        />
      </div>

      <label htmlFor="token-description">Description:</label>
      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="USDC is a faster, safer, and more efficient way to send,
          spend, and exchange money around the globe. USDC powers apps to
          provide anytime access to payments and financial services."
          name="token-description"
          id="token-description"
          aria-label="token-description"
          rows={6}
          cols={5}
        />
      </div>

      <SendTransaction
        name={name}
        iconUrl={iconUrl}
        description={description}
      ></SendTransaction>
    </div>
  );
}

function SendTransaction({
  name,
  iconUrl,
  description,
}: {
  name: string;
  iconUrl: string;
  description: string;
}) {
  const { signAndExecuteTransactionBlock, isConnected, currentAccount } =
    useWalletKit();

  const rpc = useSelector<State, RpcState>((state) => state.rpc);
  const treasuries = useSelector<State, TreasuryCapMap>(
    (state) => state.treasuryCap.value
  );

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState(<></>);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConnected || !currentAccount) {
    return (
      <div>
        <br />
        <ConnectButton connectText={"Connect wallet to mint tokens"} />
      </div>
    );
  }

  return (
    <div>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {okMsg}
      <button
        onClick={() =>
          mintTokensTx({
            setError,
            setOkMsg,
            setIsConfirming,
            signAndExecuteTransactionBlock,
            rpc,
            name,
            iconUrl,
            description,
          })
        }
        disabled={isConfirming}
      >
        {isConfirming ? <>Confirming ...</> : <>Ask wallet to mint tokens</>}
      </button>
      as {formatAddress(currentAccount.address)}
    </div>
  );
}

type MintTokensTxParams = {
  setError: (s: string) => void;
  setOkMsg: (s: JSX.Element) => void;
  setIsConfirming: (b: boolean) => void;
  signAndExecuteTransactionBlock: (input: {
    transactionBlock: TransactionBlock;
  }) => ReturnType<StandardWalletAdapter["signAndExecuteTransactionBlock"]>;
  rpc: RpcState;
  name: string;
  iconUrl: string;
  description: string;
};

async function mintTokensTx({
  setError,
  setOkMsg,
  setIsConfirming,
  signAndExecuteTransactionBlock,
  rpc,
  name,
  iconUrl,
  description,
}: MintTokensTxParams) {
  setError("");
  setOkMsg(<></>);
  setIsConfirming(true);

  try {
    // cannot be clicked if not treasury

    const tx = new TransactionBlock();

    tx.moveCall({
      arguments: [tx.pure(name), tx.pure(description), tx.pure(iconUrl)],
      typeArguments: [],
      target: `${CONTRACT_ADDRESS}::letsmovesui_nft::mint_nft`,
    });

    const { digest } = await signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });

    const digestUrl = `${EXPLORER_URL}/txblock/${digest}?network=${rpc.network}`;
    setOkMsg(
      <p style={{ color: "green" }}>
        Transaction ok! Digest&nbsp;
        <a target="_blank" href={digestUrl}>
          {digest}
        </a>
        &nbsp;(takes a few seconds to show in the explorer)
      </p>
    );
  } catch (error) {
    setError((error as Error).message);
  }

  setIsConfirming(false);
}
