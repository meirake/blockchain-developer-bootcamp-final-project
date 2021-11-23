# Avoiding common attacks

## Re-entrance attack

By removing the basket ownership for both - caller and the partner - before the token transfer itself takes place protects from the re-entrance attack. If somebody tries to deposit a NFT or cancel while transfering tokens it will not get through as the `isBasketOwner`-check protecting every public function will fail.

## Tx.origin Authentication

The ownership check uses `msg.sender` to avoid attacks based on `tx.origin` exploit.

## Using specific compiler pramgma

Self explanatory.

## Modifier only for validation

Self explanatory.

## Checks-Effects-Interactions

"Checks-Effects-Interactions"-pattern is used throughout all functions. Some overlap with "re-entrance attack" and "modifier only for validation" explanation.