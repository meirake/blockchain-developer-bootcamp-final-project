# Design Pattern decisions

## Inter-Contract execution

The Escrow contract calls function from other contracts that implement the IERC721 interface. This is needed as the Escrow contract is able to transfer ERC721 NFTs to itself and later to their new (or in case of canceling to their previous) owner.

## Inheritance

The Escrow contract inherits from the ERC721Holder.sol to allow safe transfer of ERC721 NFTs.

## Access restrictions

Baskets can only be viewed and modified by basket owner. Views can also be executed for the partners basket. Modifier `isBasketOwner()` checks for this.