const Cos = require("../lib/index");

let cos = new Cos("test", "https://testnode.contentos.io");
cos.wallet.addAccount("initminer", "4DjYx2KAGh1NP3dai7MZTLUBMMhMBPmwouKE8jhVSESywccpVZ");

(async () => {
    // let result = await cos.wallet.delegateVest("initminer", "producer1", "123.987654", 15);
    // console.log(result);
    // let result = await cos.wallet.unDelegateVest("initminer", 12);
    // console.log(result);
    // let result = await cos.wallet.vestDelegationOrderList("initminer", 30, true);
    let result = await cos.wallet.vestDelegationOrderList("producer1", 30, false);
    console.log(result);

})();
