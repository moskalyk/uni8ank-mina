import {
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Permissions,
  Experimental,
  Scalar,
  PublicKey,
  PrivateKey,
} from 'snarkyjs';

/**
 * Uni8ank Example of crystal compute and merkle tree storage
 */
export class Add extends SmartContract {
  @state(Field) nonceUser = State<Field>();
  @state(Field) root = State<MerkleRoot>();

  events = {
    'decisional-path': Scalar,
    'crystal-compute': Scalar,
  };

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method init(treeHeight: number, subTreeHeight: number) {
    // this.num.set(Field(1));
    const tree = new Experimental.MerkleTree(treeHeight);

    for (let i = 0; i < 2 ** 8; i++) {
      tree.setLeaf(i, new Experimental.MerkleTree(2 ** 8));
    }

    this.root.set(tree);
    this.nonceUser.set(Field(0));
  }

  @method addUser(treeID: number, signerPrivateKey: PrivateKey) {
    // add user
    const signerPublicKey = signerPrivateKey.toPublicKey();
    this.root.setLeaf(treeID, Tree.setLeaf(this.nonceUser, signerPublicKey));
    this.nonceUser.set(Field(this.nonceUser).add(1));
  }

  @method _checkUser(signerPublicKey: PublicKey) {
    // check if the user is part of the set
    for (let i = 0; i < 2 ** 8; i++) {
      for (let j = 0; i < 2 ** 3; i++) {
        signerPublicKey
          .equals(
            new Experimental.MerkleTreeFromRoot(this.root)
              .checkLeaf(i)
              .checkLeaf(j)
          )
          .assertEquals(true);
      }
    }
  }

  @method podAura(signerPrivateKey: PrivateKey) {
    // loop through merkle tree of pods
    // once in a pod, see if a member of a group exists
    // add symbols to a scalar, and return the list of symbols
  }

  @method postSymbol(
    stake: Field,
    defferedLeft: Field,
    defferedRight: Field,
    signerPrivateKey: PrivateKey
  ) {
    // read from last event posts, maybe use blocks of mina chain
    const post = EventStream.messageHistoryHash().slice(-1);
    const endDate = UInt64.from(Now());

    // make it possible to only post between certain times
    // after all people in a pod have posted, get last update from the tree
    // #growwithyourteam
    this.network.timestamp.assertBetween(post.date(), endDate);

    const signerPublicKey = signerPrivateKey.toPublicKey();

    this._checkUser(signerPublicKey);

    // Compute new messageHistoryHash
    const oldHash = this.messageHistoryHash.get();
    const newHash = Poseidon.hash([stake, oldHash]);

    // Update on-chain state
    this.messageHistoryHash.set(newHash);
    // TODO: if set the message history hash as a simple hash aggregation,
    // how to read the smart contract from an id of merkle tree and it's leafs

    // TODO: how to read an 'ongoing memory of symbol ontology as culture stake shifts'
    this.emitEvent('update-merkle-leaf', [defferedLeft, stake, defferedRight]);

    // TODO: return current pod of symbols
    // return this.podAura()
  }

  @method computeCrystal(
    PointGroup: Field,
    BravaisLattice: Field,
    signerPrivateKey: PrivateKey
  ) {
    const signerPublicKey = signerPrivateKey.toPublicKey();
    const num = PointGroup.add(BravaisLattice);
    this.emitEvent('crystal-compute', [num, signerPublicKey]);
    return num;
  }
}
