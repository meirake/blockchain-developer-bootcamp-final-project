# blockchain-developer-bootcamp-final-project
Final Project for ConsenSys Blockchain Course 

### Escrow contract

- 2 parties want to exchange any kind of tokens (can be multiple tokens each)
- Each of them can fill one bucket in the smart contract (only their own bucket)
- they can remove items form their own bucket 
- Each of them can agree that they would like to exchange the current states of both buckets
- Each of them can view items in both buckets
- Removing or adding items will invalidate previous given agreement of both parties
- if both agree the buckets will be exchanged
  - secure the exchange without allowing changes inbetween?
  - transfer it directly to the new owner of bucket or let them call a "withdraw" function?