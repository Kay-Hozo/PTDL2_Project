import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import SocialNetwork from '../abis/SocialNetwork.json'
import TokenSCN from '../abis/TokenSCN.json'
import Navbar from './Navbar'
import Main from './Main'

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
    // await this.loadToken()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = SocialNetwork.networks[networkId]
    if(networkData) {
      const socialNetwork = new web3.eth.Contract(SocialNetwork.abi, networkData.address)
      this.setState({ socialNetwork })
      const postCount = await socialNetwork.methods.postCount().call()
      this.setState({ postCount })
      // Load Posts
      for (var i = 1; i <= postCount; i++) {
        const post = await socialNetwork.methods.posts(i).call()
        this.setState({
          posts: [...this.state.posts, post]
        })
      }
      // Load voter of post
      const voterCount = this.state.posts.vote;
      // for (var i = 1; i <= postCount; i++) {
      //   for (var j = 0; j < voterCount; i++) {
      //     const voter = await socialNetwork.methods.voterOfPost(i, j).call()
      //     this.setState({
      //       voter:[...this.state.voter, voter]
      //     })
      //   }
      // }
      for (var i = 0; i < voterCount; i++) {
        const voter = await socialNetwork.methods.voterOfPost(1, i).call()
        this.setState({
          voter:[...this.state.voter, voter]
        })
      }
      // Sort posts. Show highest tipped posts first
      this.setState({
        posts: this.state.posts.sort((a,b) => b.tipAmount - a.tipAmount )
      })
      this.setState({ loading: false})
    } else {
      window.alert('SocialNetwork contract not deployed to detected network.')
    }
  }

  // async loadToken() {
  //   const web3 = window.web3
  //   const networkId = await web3.eth.net.getId()
  //   const networkData = TokenSCN.networks[networkId]
  //   if(networkData) {
  //     const tokenSCN = new web3.eth.Contract(TokenSCN.abi, networkData.address)
  //     console.log("token: ", tokenSCN);
  //     this.setState({tokenSCN})

  //     const tokenTotal = await tokenSCN.methods.
  //   } else {
  //     window.alert('No token found')
  //   }
  // }

  createPost(content) {
    this.setState({ loading: true })
    this.state.socialNetwork.methods.createPost(content).send({ from: this.state.account })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  tipPost(id, tipAmount) {
    this.setState({ loading: true })
    this.state.socialNetwork.methods.tipPost(id).send({ from: this.state.account, value: tipAmount })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  votePost(id){
    this.setState({ loading: true })
    this.state.socialNetwork.methods.votePost(id).send({ from: this.state.account})
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  isVote(address,id){
    let result = this.state.socialNetwork.methods.addressVotes(address,id).call()
    return result;
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      socialNetwork: null,
      tokenSCN: null,
      postCount: 0,
      posts: [],
      voter: [],
      tokenTotal: 0,
      loading: true
    }

    this.createPost = this.createPost.bind(this)
    this.tipPost = this.tipPost.bind(this)
    this.votePost = this.votePost.bind(this)
    this.isVote = this.isVote.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              posts={this.state.posts}
              createPost={this.createPost}
              tipPost={this.tipPost}
              tokenTotal={this.state.tokenTotal} 
              votePost={this.votePost}
              isVote={this.isVote}
              account={this.state.account}
            />
        }
      </div>
    );
  }
}

export default App;
