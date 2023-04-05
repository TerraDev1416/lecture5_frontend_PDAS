// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";

import { Program, AnchorProvider, web3, utils, BN } from "@project-serum/anchor";
import idl from "/home/jason/solana3/dapp-scaffold-main1/src/components/solpdas.json";
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const idl_string = JSON.stringify(idl)
const idl_object = JSON.parse(idl_string)
 
const programID = new PublicKey(idl.metadata.address)

export const Bank: FC = () => {
  const ourWallet = useWallet();
  const { connection } = useConnection();

  const [banks, setBanks] = useState([]);
  const [errorMessage, setErrorMessage] = useState<string>(""); // Define errorMessage state variable


  const getProvider = () => {
    const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions())
    return provider
  }

  const createBank = async () => {
    try {
      const anchProvider = getProvider()
      const program = new Program(idl_object, programID, anchProvider)

      const [bank] = await PublicKey.findProgramAddressSync([
        utils.bytes.utf8.encode("bankaccount"),
        ourWallet.publicKey.toBuffer()
      ], program.programId)

      await program.rpc.create("Solana Bank", {
        accounts: {
          bank,
          user: ourWallet.publicKey,
          systemProgram: web3.SystemProgram.programId
        }
      })

      console.log("Wow, new bank was created:" + Bank.toString())

    } catch (error) {
      console.error("Error while creating bank: (" + error)
    }

  }

  const getBanks = async () => {
    const anchProvider = getProvider()
    const program = new Program(idl_object, programID, anchProvider)

    try {
      const bankAccounts = await connection.getProgramAccounts(programID);
      const bankData = await Promise.all(bankAccounts.map(async bank => ({
        ...(await program.account.bank.fetch(bank.pubkey)),
        pubkey: bank.pubkey
      })));
      setBanks(bankData);
      console.log(bankData);
    } catch (error) {
      console.error("Error while getting the banks", error)
    }
  }

  const depositBank = async (publicKey) => {
    try {
      const anchProvider = getProvider()
      const program = new Program(idl_object, programID, anchProvider)

      await program.rpc.deposit(new BN(0.1 * web3.LAMPORTS_PER_SOL), {
        accounts: {
          bank: publicKey,
          user: ourWallet.publicKey,
          systemProgram: web3.SystemProgram.programId
        }

      })

      console.log("Deposit done: " + publicKey)

    } catch (error) {
      console.error("Error while depositing", error)

    }

  };

  const withdrawBank = async (publicKey: PublicKey) => {
    try {
        const program = new Program(idl_object, programID, getProvider())

        await program.rpc.withdraw(new BN(0.1 * LAMPORTS_PER_SOL), {
            accounts: {
                bank: publicKey,
                user: ourWallet.publicKey,
            }
        })

        console.log("Withdraw done: " + publicKey.toBase58())

    } catch (error) {
        console.error("Error while withdrawing", error)
    }
    // Refresh the bank data after a withdrawal
    await getBanks();
}


return (
  <>
      {banks.map((bank) => {
          return (
              <div className="md:hero-content flex flex-col" key={bank.pubkey.toBase58()}>
                  <h1>{bank.name.toString()}</h1>
                  <span>{bank.balance.toString()}</span>
                  <button
                      className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                      onClick={async () => {await depositBank(bank.pubkey);}}
                  >
                      <span>
                          Deposit 0.1
                      </span>
                  </button>
                  <button
                      className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                      onClick={async () => {await withdrawBank(bank.pubkey);}}
                  >
                      <span>
                          Withdraw 0.1
                      </span>
                  </button>
              </div>
          )
      })}
      <div className="flex flex-row justify-center">
          <>
              <div className="relative group items-center">
                  <div className="m-1 absolute -nset-0.5 bg-gradient-to-r from-indigo-500 to-fuschsia-500 rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <button
                      className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                      onClick={async () => {await createBank();}}
                  >
                      <span className="block group-disabled:hidden">
                          Create Bank
                      </span>
                  </button>
                  <button
                      className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                      onClick={async () => {await getBanks();}}
                  >
                      <span className="block group-disabled:hidden">
                          Fetch Banks
                      </span>
                  </button>
              </div>
          </>
      </div>
  </>
);

};
