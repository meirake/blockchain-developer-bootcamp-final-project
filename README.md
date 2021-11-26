# blockchain-developer-bootcamp-final-project: Escrow
Final Project for ConsenSys Blockchain Course 

## Escrow contract

Two parties want to exchange NFTs (ERC721) but do not trust each other. They can start a transaction via the Escrow contract. First, one of the participants has to create the "baskets" by providing the address of their partners account and their own account. 

When two participants have an open Transaction ongoing both can deposit NFTs in their baskets. Each of the partners can "agree" to exchange the tokens. If both partners agree, the tokens of partner1 will be transfered to partner2 and vice versa. Each time a aprticipant deposits another NFT, all previous agreements are invalidated.

Of course both participants can view the content of their own and their partners basket.

Please be aware that you always need to approve the Escrow contract for an NFT before you can deposit it.

If one partner wants to cancel the transaction they can execute a "cancel". The already deposited tokens will be returned to their previous owners.

At the moment each account can only have one ongoing transaction in this contract.

## Directory structure

- `client` React frontend
- `contracts` solidity contracts
- `helper` scripts for faster manual testing during development
- `migrations` migration files to deploy contracts
- `test` truffle tests

## Prequisits

- Node.js >= v14
- Truffle
- npm
## Tun Truffle tests

Run `truffle test` from project root.

## Deploy on local network using Truffle

- `npm install`
- `truffle migrate --network develop`

or 

- `npm install`
- `truffle develop`
- `truffle(develop)> migrate`

To be able to interact from console with contracts.

## Run frontend

- `cd client`
- `npm install`
- `npm start`

Access frontend via `localhost:3000`. Make sure you have deployed the contracts before on truffle network develop and connected MetaMask to it (URL `http://127.0.0.1:9545` and Chain ID `1337`). Otherwise use the contract deployed on Rinkeby.

## Use hosted frontend

https://meirake.github.io/blockchain-developer-bootcamp-final-project/

## Possible improvements

- Allow users to participate in more than one ongoing transaction.
- Allow users to withdraw single items from their baskets
- Frontend: better signaling when transactions have finished and next step can be invoked (e.g. between approving and depositing an NFT).
- Inform user via Frontend when tokens where exchanged successfully after both user agreed (instead of just showing the start screen again.)

## Account for NFT certificate

0x12ce2f6eb95700Be3D15D48Bc0Cf1A1efe6f52FE
