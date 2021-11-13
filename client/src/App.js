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
    owner1: "",
    owner2: ""
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
        owner1: accounts[0] 
      });
      await this.updateHasBasket();
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
      {from: this.state.accounts[0]});
    this.setState({hasBasket: hasBasket});
  }

  async makeBaskets() {
    await this.state.contract.methods.createBaskets(
      this.state.owner1, this.state.owner2).send({ from: this.state.owner1 }
    );
    await this.updateHasBasket();
    console.log("Made baskets.")
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    if (this.state.hasBasket) {
      return <div>Yeay, has a basket.</div>;
    }
    return (
      <div className="App">
        <h1>Escrow</h1>
        <input 
          value={this.state.owner2}
          type="text" 
          onChange={(e)=>{this.setState({owner2: e.target.value})}}
        /> 
        <button onClick ={() => this.makeBaskets()}>Make baskets</button>
      </div>
    );
  }
}

export default App;
