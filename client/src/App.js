import React, { Component } from "react";
import EscrowContract from "./contracts/Escrow.json";
import ERC721 from "./contracts/ERC721.json";
import getWeb3 from "./getWeb3";

import "./App.css";


const emptyAddr = "0x0000000000000000000000000000000000000000";
class App extends Component {
  state = {
    web3: null, 
    accounts: null, 
    contract: null,
    contractAddr: "",
    hasBasket: false,
    account: "",
    myBasket: [],
    partnersBasket: [],
    myAgree: false,
    partnerAgree: false
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const isRinkeby = networkId === 4;
      const isLocal = networkId > 1000;
      if (!isRinkeby && !isLocal) {
        alert("Please switch to Rinkeby testnet.")
      }
      const deployedNetwork = EscrowContract.networks[networkId];
      const instance = new web3.eth.Contract(
        EscrowContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // watch events
      instance.events.successfulDeposit({}, 
        () => this.updateAll());
      instance.events.setAgreed({}, 
        () => this.updateAgreed());
      instance.events.successfulCancel({}, 
        () => this.updateHasBasket());
      instance.events.createdBasket({}, 
        () => this.updateAll());

      this.setState({ 
        web3: web3, 
        accounts: accounts, 
        contract: instance, 
        contractAddr: deployedNetwork.address,
        account: accounts[0] 
      });
      await this.updateHasBasket();
      await this.updateBasketContents();
      await this.updateAgreed();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  async updateHasBasket() {
    const hasBasket = await this.state.contract.methods.hasBasket().call(
      {from: this.state.account});
    this.setState({hasBasket: hasBasket});
  }

  async updateBasketContents() {
    await this.updateHasBasket();
    if (!this.state.hasBasket) {
      return;
    }
    let myTokens = [];
    let pTokens = [];
    const nrTokens = await this.state.contract.methods.viewNumberOfDepositedTokens().call({from: this.state.account});
    for(let i = 0; i < nrTokens[0]; ++i) {
      const token = await this.state.contract.methods.viewMyBasket(i).call({from: this.state.account});
      myTokens.push(token);
    }
    for(let i = 0; i < nrTokens[1]; ++i) {
      const token = await this.state.contract.methods.viewPartnerBasket(i).call({from: this.state.account});
      pTokens.push(token);
    }
    this.setState({myBasket: myTokens, partnersBasket: pTokens});
  }

  async updateAgreed() {
    await this.updateHasBasket();
    if (!this.state.hasBasket) {
      return;
    }
    const agreement = await this.state.contract.methods.viewState().call(
      {from: this.state.account}
    );
    this.setState({
      myAgree: agreement.agree1, 
      partnerAgree: agreement.agree2
    });
  }

  async updateAll() {
    await this.updateHasBasket();
    await this.updateAgreed();
    await this.updateBasketContents();
  }

  async onAgree() {
    await this.updateHasBasket();
    if (!this.state.hasBasket) {
      return;
    }
    await this.state.contract.methods.agree().send(
      {from: this.state.account}
    );
    console.log("Agreed");
    await this.updateAgreed();
  }

  async onCancel() {
    await this.updateHasBasket();
    if (!this.state.hasBasket) {
      return;
    }
    await this.state.contract.methods.cancel().send(
      {from: this.state.account}
    );
    console.log("Canceled");
    await this.updateHasBasket();
  }

  async makeBaskets(partner) {
    await this.state.contract.methods.createBaskets(
      this.state.account, partner).send({ from: this.state.account }
    );
    await this.updateHasBasket();
    console.log("Made baskets.")
  }

  async approveToken(tokenAddr, tokenId) {
    await this.updateAll();
    if (!this.state.hasBasket) {
      return;
    }
    let erc721 = new this.state.web3.eth.Contract(
      ERC721.abi,
      tokenAddr
    );
    try {
      await erc721.methods.approve(this.state.contractAddr, tokenId).send(
        {from: this.state.account}
      );
    } catch (error) {
      console.log(error);
      const msg = (error + 
        "\n\n Please make sure that: \n" +
        "- the NFT address is valid \n" +
        "- the token ID is correct \n" +
        "- you are the owner of this token \n");
      alert(msg);
    }
  }

  async deposit(tokenAddr, tokenId) {
    // TODO: doesn't catch contract require statements properly.
    await this.updateAll();
    if (!this.state.hasBasket) {
      return;
    }
    try {
      await this.state.contract.methods.deposit(
        tokenAddr, tokenId).send({from: this.state.account});
      await this.updateBasketContents();
    }
    catch (error) {
      console.log(error);
      const msg = (error + 
        "\n\n Please make sure that: \n" +
        "- the NFT address is valid \n" +
        "- the token ID is correct \n" +
        "- you are the owner of this token \n" +
        "- you approved the Escrow contract for this token\n");
      alert(msg);
    }
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    if (this.state.hasBasket) {
      return (
        <div className="App">
          <h1>Your open transaction</h1>
        <button className="update"
          onClick={() => this.updateAll()}>
          Update
        </button>
          <ViewBaskets 
            myBasket = {this.state.myBasket}
            pBasket = {this.state.partnersBasket}
          />
          <div className="row">
            <div className="col">
              <Deposit 
                onApprove={(addr, id) => this.approveToken(addr, id)}
                onDeposit={(addr, id) => this.deposit(addr, id)}
              />
            </div>
            <div className="col">
              <Status
                myAgree = {this.state.myAgree}
                pAgree = {this.state.partnerAgree}
              />
            </div>
            <div className="col">
              <Actions
                onAgree={() => this.onAgree()}
                onCancel={() => this.onCancel()}
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="App">
        <h1>Create a transaction</h1>
        <CreateTransaction
          onClick={(partner) => this.makeBaskets(partner)}
        />
      </div>
    );
  }
}

class Actions extends Component {

  render() {
    return(
      <div className="GroupActions">
        <h2>Actions</h2>
        <div>
        <button className="actions"
          onClick={() => this.props.onAgree()}>
          Agree
        </button>
        </div>
        <div>
        <button  className="actions"
          onClick={() => this.props.onCancel()}>
          Cancel
        </button>
        </div>

      </div>);
  }
}

class Deposit extends Component {
  state ={
    tokenAddress: "",
    tokenId: 0
  };

  render(){
    return(
      <div className="GroupDeposit">
        <h2>Deposit an NFT</h2>
        <div>
          <label className="deposit"> Address: </label>
          <input 
            className="deposit"
            placeholder = {emptyAddr}
            value={this.state.tokenAddress}
            type="text" 
            onChange={(e)=>{this.setState({tokenAddress: e.target.value})}}
          /> 
        </div>
        <div>
          <label className="deposit"> ID: </label> 
          <input 
            className="deposit"
            placeholder = {emptyAddr}
            value={this.state.tokenId}
            type="number" 
            onChange={(e)=>{this.setState({tokenId: e.target.value})}}
          /> 
        </div>
        <div>
          <button className="deposit"
            onClick={() => this.props.onApprove(this.state.tokenAddress, this.state.tokenId)}>
            Approve
          </button>
          <button className="deposit"
            onClick={() => this.props.onDeposit(this.state.tokenAddress, this.state.tokenId)}>
            Deposit
          </button>
        </div>
      </div>
    );
  }
}

class Status extends Component {
  getColor(agreed) {
    if (agreed) {
      return "green";
    }
    return "red";
  }

  getText(agreed) {
    if (agreed) {
      return "agreed.";
    }
    return "did not agree.";
  }

  render() {
    return(
      <div className="GroupMiddle">
        <h2>Status</h2>
        <p className={this.getColor(this.props.myAgree)}>
          <b>{"You " + this.getText(this.props.myAgree)}</b>
        </p>
        <p className={this.getColor(this.props.pAgree)}>
          <b>{"Your partner " + this.getText(this.props.pAgree)}</b>
        </p>
      </div>);
  }
}

class ViewBaskets extends Component {
  basketElements(basket) {
    const tokens = basket.map((token, index) => {
      return (
        <li key={index}>
          <p>Token address:<br/>
          {token[0]}<br/>
          Token ID:<br/>
          {token[1]}
          </p>
        </li>
      )
    });
    return tokens;
  }

  render(){
    return(
      <div className="Group">
        <div className="row">
          <div className = "colInside">
            <h2>My Basket</h2>
            <ul className ="basket">
              {this.basketElements(this.props.myBasket)}
            </ul>
          </div>
          <div className = "colInside">
            <h2>Partner Basket</h2>
            <ul className ="basket">
              {this.basketElements(this.props.pBasket)}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
class CreateTransaction extends Component {
  state = {
    partner: ""
  };

  render(){
    return(
      <div>
        <input className="address"
          placeholder={emptyAddr}
          value={this.state.partner}
          type="text" 
          onChange={(e)=>{this.setState({partner: e.target.value})}}
        /> 
        <button onClick={() => this.props.onClick(this.state.partner)}>Make baskets</button>
      </div>
    );
  }
}

export default App;
