let Escrow = artifacts.require("Escrow");
let TestNFTs = artifacts.require("TestNFTs");
let { catchRevert } = require("./exceptionsHelpers.js");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Escrow", function (accounts) {
  const [_owner, harry, ron, draco] = accounts;

  const emptyAddress = "0x0000000000000000000000000000000000000000";
  const nftAddress = "0x0000000000000000000000000000000000000001";
  const defaultTokenID = 0;
  const nftIndex = 371;
  const nftIndex2 = 567;

  let testee;

  beforeEach(async () => {
    testee = await Escrow.new();
  });

  describe("Create Baskets", () => {
    it("can create a basket", async () => {
      const tx = await testee.createBaskets(harry, ron, {from: harry});
      //console.log(tx);
      assert.equal(tx.logs[0].event, "createdBasket");
    });
    it("cannot create 2nd baskets", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      await catchRevert(testee.createBaskets(ron, harry, {from: ron}));
      await catchRevert(testee.createBaskets(harry, ron, {from: harry}));
    });
  });

  describe("View State", () => {
    it("Get correct data for existing State", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const result = await testee.viewState.call({from: harry});
      assert.equal(result[0], harry, "Owner1 is not harry.");
      assert.equal(result[1], ron, "Owner2 is not Ron.");
      assert.isFalse(result[2], "Agree1 is not False.");
      assert.isFalse(result[3], "Agree2 is not False.");
    });
    it("Get empty state for caller without basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const result = await testee.viewState.call({from: draco});
      assert.equal(result[0], emptyAddress, "Owner1 is not 0x0.");
      assert.equal(result[1], emptyAddress, "Owner2 is not 0x0.");
      assert.isFalse(result[2], "Agree1 is not False.");
      assert.isFalse(result[3], "Agree2 is not False.")
    });
  });

  describe("Deposit", () => {
    it("Correct deposition for existing basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const txH = await testee.deposit(nftAddress, nftIndex, {from: harry});
      assert.equal(txH.logs[0].event, "successfulDeposit", 
      "Expected successfullDeposit Event for Harry");
      const txR = await testee.deposit(nftAddress, nftIndex, {from: ron});
      assert.equal(txR.logs[0].event, "successfulDeposit", 
      "Expected successfullDeposit Event for Ron");
    });
    it("Cannot deposit without basket", async () => {
      await catchRevert(testee.deposit(nftAddress, nftIndex, {from: harry}));
    });
  });

  describe("Agree", () => {
    it("Proper use of agree", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const tx = await testee.agree({from: ron});
      const result = await testee.viewState.call({from: ron});
      assert.isTrue(result[2], "Agree1 is not true (Ron's agreement).");
      assert.equal(tx.logs[0].event, "setAgreed");
    });
    it("Agree without basket fails", async () => {
      await catchRevert(testee.agree({from: draco}));
    }) 
    it("Invalidate agreement after deposit", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      for (const account of [harry, ron]) {
        await testee.agree({from: harry});
        const agreeBefore = await testee.viewState.call({from: ron});
        assert.isTrue(agreeBefore[3], "Agree2 (Harry) is not True.");
        await testee.deposit(nftAddress, nftIndex, {from: account});
        const agreeAfter = await testee.viewState.call({from: ron});
        assert.isFalse(agreeAfter[3], "Agree2 (Harry) is not False.");
      }
    })
    it("Invalidate agreement after withdraw", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      for (const account of [harry, ron]) {
        await testee.agree({from: harry});
        const agreeBefore = await testee.viewState.call({from: harry});
        assert.isTrue(agreeBefore[2], "Agree1 (Harry) is not True.");
        await testee.withdraw({from: account});
        const agreeAfter = await testee.viewState.call({from: harry});
        assert.isFalse(agreeAfter[2], "Agree1 (Harry) is not False.");
      }
    })
  });

  describe("View Baskets", () => {
    beforeEach(async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      for (let i = 0; i < 3; ++i){
        await testee.deposit(nftAddress, nftIndex, {from: harry});
      }
      for (let i = 0; i < 2; ++i){
        await testee.deposit(nftAddress, nftIndex2, {from: ron});
      }
    });

    it("View own basket, valid index", async () => {
      const result = await testee.viewMyBasket(0, {from: harry});
      assert.equal(result[0], nftAddress, "Returned wrong address.");
      assert.equal(result[1], nftIndex, "Returned wrong Index");
    });
    it("View own basket, invalid index", async () => {
      const result = await testee.viewMyBasket(71, {from: harry});
      assert.equal(result[0], emptyAddress, "Returned wrong address.");
      assert.equal(result[1], defaultTokenID, "Returned wrong Index");
    });
    it("View partner basket, valid index", async () => {
      const result = await testee.viewPartnerBasket(0, {from: harry});
      assert.equal(result[0], nftAddress, "Returned wrong address.");
      assert.equal(result[1], nftIndex2, "Returned wrong Index");
    });
    it("View partner basket, invalid index", async () => {
      const result = await testee.viewPartnerBasket(71, {from: harry});
      assert.equal(result[0], emptyAddress, "Returned wrong address.");
      assert.equal(result[1], defaultTokenID, "Returned wrong Index");
    });
    it("Has no basket, view own basket", async () => {
      await catchRevert(testee.viewMyBasket(1, {from: draco}));
    });
    it("Has no basket, view partner basket", async () => {
      await catchRevert(testee.viewPartnerBasket(1, {from: draco}));
    });
  });
});
