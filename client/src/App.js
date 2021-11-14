import React, { Component } from "react";
import EscrowContract from "./contracts/Escrow.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = {
    web3: null, 
    accounts: null, 
    contract: null,
    hasBasket: false,
    account: "",
    myBasket: [],
    partnersBasket: []
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EscrowContract.networks[networkId];
      const instance = new web3.eth.Contract(
        EscrowContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      this.setState({ 
        web3: web3, 
        accounts: accounts, 
        contract: instance, 
        account: accounts[0] 
      });
      await this.updateHasBasket();
      await this.updateBasketContents();
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
      // console.log(token[1]);
    }
    for(let i = 0; i < nrTokens[1]; ++i) {
      const token = await this.state.contract.methods.viewPartnerBasket(i).call({from: this.state.account});
      pTokens.push(token);
    }
    this.setState({myBasket: myTokens, partnersBasket: pTokens});
    console.log(this.state.myBasket);
    console.log(this.state.partnersBasket);
  }

  async makeBaskets(partner) {
    await this.state.contract.methods.createBaskets(
      this.state.account, partner).send({ from: this.state.account }
    );
    await this.updateHasBasket();
    console.log("Made baskets.")
  }

  async deposit(tokenAddr, tokenId) {
    // TODO: doesn't catch contract require statements properly.
    await this.updateHasBasket();
    if (!this.state.hasBasket) {
      return;
    }
    try {
      await this.state.contract.methods.deposit(
        tokenAddr, tokenId).send({from: this.state.account});
      this.updateBasketContents();
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
          <ViewBaskets 
            myBasket = {this.state.myBasket}
            pBasket = {this.state.partnersBasket}
            onClick={() => this.updateBasketContents()} 
          />
          <Deposit 
            onClick={(addr, id) => this.deposit(addr, id)}
          />
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

class Deposit extends Component {
  state ={
    tokenAddress: "",
    tokenId: 0
  };

  render(){
    const emptyAddr = "0x0000000000000000000000000000000000000000";
    return(
      <div className="Group">
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
          <button onClick={() => this.props.onClick(this.state.tokenAddress, this.state.tokenId)}>Deposit</button>
        </div>
      </div>
    );
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
          <div className = "col">
            <h2>My Basket</h2>
            <ul className ="basket">
              {this.basketElements(this.props.myBasket)}
            </ul>
          </div>
          <div className = "col">
            <h2>Partner Basket</h2>
            <ul className ="basket">
              {this.basketElements(this.props.pBasket)}
            </ul>
          </div>
        </div>
          <button onClick={() => this.props.onClick()}>
            UpdateBaskets
          </button>
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
        <input 
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
