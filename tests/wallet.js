// import {parseIntoNumber} from "../src/util";
const util = require("../lib/util");

const Cos = require("../lib/index");

let cos = new Cos("", "");


(async () => {
  // let result = await cos.wallet.accountInfo("initminer");
  // console.log(result);
  let r = util.parseIntoNumber("100.256610");
  console.log(r);
})();
