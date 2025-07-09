/**
 * オブジェクトのディープコピー
 *
 * a deep copy of an Object
 * @param {Object} obj
 * @returns {Object}
 */
const copyObject: <T>(obj: T) => T = <T>(obj: T) =>
  JSON.parse(JSON.stringify(obj));

/**
 * 配列要素を要素の内容自体を指定して削除します。
 *
 * Remove item in array by target value
 *
 * ```ts
 * removeItem(["a","b","c"],"b");
 * //->["a","c"]
 * ````
 *
 * @param {Array} arr
 * @param {Array} target
 */
function removeItem<T>(arr: T[], target: T): void {
  const i: number = arr.indexOf(target);
  if (i >= 0) {
    arr.splice(i, 1);
  }
}

/**
 * Object.keys()を拡張してユニオン型の配列を返すようにします。
 *
 * Wrapper of ```Object.keys()``` which returns union[]
 *
 * @param {Object} obj Object
 * @returns {string[]}
 */
function objectKeys<T extends { [key: string]: unknown }>(obj: T): (keyof T)[] {
  return Object.keys(obj);
}

/**
 * 配列を要素とする連想配列（辞書）の逆引き
 *
 * ```ts
 * reverseDictionary( {a:[x,y],b:[z]} )
 * -> {x:a,y:a,z:b}
 * ```
 *
 * @param {Object} dict Dictionary (Object of which each parameter is an array)
 * @returns {Object} reversed dictionary {value:key}
 */
const reverseDictionary: <
  K extends string | number | symbol,
  V extends string | number | symbol
>(dict: { [k in K]: V[] }) => { [v in V]: K } = <
  K extends string | number | symbol,
  V extends string | number | symbol
>(dict: { [k in K]: V[] }) => {
  return Object.assign(
    {},
    ...objectKeys(dict)
      .map((key) => dict[key].map((val) => ({ [val]: key })))
      .reduce((join, arr) => [...join, ...arr])
  );
};

/**
 * 桁数制限の上限
 */
const DIGIT_UPPER = 8;

/**
 * button要素の種類の名称
 */
type buttonType =
  | "zero"
  | "number"
  | "one"
  | "dot"
  | "percent"
  | "root"
  | "muldiv"
  | "plus"
  | "minus"
  | "exp"
  | "clear"
  | "delete"
  | "calc"
  | "error";

/**
 * button要素の種類をグループ化したものの名称
 */
type buttonGroup =
  | "zero"
  | "natural"
  | "state_changer"
  | "plus_minus"
  | "controller";

/**
 * 各buttonGroupに属するbuttonTypeの定義
 *
 *　members of each buttonGroup
 */
const buttonsOfGroup: { [key in buttonGroup]: buttonType[] } = {
  zero: ["zero"],
  natural: ["number", "one"],
  state_changer: ["dot", "percent", "root", "muldiv", "exp", "error"],
  plus_minus: ["plus", "minus"],
  controller: ["clear", "delete", "calc"],
} as const;

/**
 * 各buttonTypeが属するbuttonGroupの逆引き
 *
 * buttonGroup which each buttonType belongs to
 */
const groupOfButton: { [key in buttonType]: buttonGroup } =
  reverseDictionary(buttonsOfGroup);

/**
 * buttonのtypeと個別の値の組
 *
 * set of button type and individual input value
 */
type buttonInput = { type: buttonType; value: string | undefined };

/**
 * 入力を許容するか判定するための現在の数式の状態
 *
 * the state of formula for judgement of next input
 */
type inputState = {
  accept: buttonType[];
  overwrite: buttonType[];
  renew: buttonType[];
};

/**
 * stateの名称
 *
 * name of formula state
 */
type stateName =
  | "default"
  | "zero"
  | "number"
  | "one"
  | "muldiv"
  | "addsub"
  | "dot"
  | "decimal"
  | "percent"
  | "root"
  | "in_root"
  | "digit_upper"
  | "exp"
  | "answer"
  | "error";

/* stateの定義 */

/**
 * 初期状態の0：小数点や演算子以外は上書きする
 */
const state_default: inputState = {
  accept: ["dot", "muldiv", "plus", "percent"],
  overwrite: ["number", "one", "root", "minus", "error"],
  renew: [],
};

/**
 * state_defaultの拡張：1 + 0　のような非先頭の0は計算実行を許可
 */
const state_zero: inputState = copyObject(state_default);
state_zero.accept.push("calc");

/**
 * 一般的な数字は後に何が来ても許容
 */
const state_number: inputState = {
  accept: [
    "zero",
    "number",
    "one",
    "dot",
    "percent",
    "root",
    "muldiv",
    "plus",
    "minus",
    "exp",
    "calc",
  ],
  overwrite: [],
  renew: ["error"],
};

/**
 * state_numberの拡張：1のみ1√xの形は不可
 */
const state_one: inputState = copyObject(state_number);
removeItem(state_one.accept, "root");
state_one.overwrite.push("root");

/**
 * state_numberの拡張：小数の中では小数点不可
 */
const state_decimal: inputState = copyObject(state_number);
removeItem(state_decimal.accept, "dot");

/**
 * state_numberの拡張：ルートの中ではルート不可
 */
const state_in_root: inputState = copyObject(state_number);
removeItem(state_in_root.accept, "root");

/**
 * 演算子グループの雛形：直接使用しない
 */
const _state_operator: inputState = {
  accept: ["number", "one", "zero", "root"],
  overwrite: ["muldiv", "plus"],
  renew: ["error"],
};
/**
 * 乗除算のときは直後に負号の-を許容
 */
const state_muldiv: inputState = copyObject(_state_operator);
state_muldiv.accept.push("minus");

/**
 * 加減算のときは直後の負号の-は上書き
 */
const state_addsub: inputState = copyObject(_state_operator);
state_addsub.overwrite.push("minus");

/**
 * 数字系許容の雛形：直接使用しない
 */
const _state_accept_numbers: inputState = {
  accept: ["zero", "number", "one"],
  overwrite: [],
  renew: ["error"],
};
/**
 * 数字系許容：小数点の直後
 */
const state_dot: inputState = copyObject(_state_accept_numbers);
/**
 * 数字系許容：ルートの直後
 */
const state_root: inputState = copyObject(_state_accept_numbers);

/**
 * エラーの直後は先頭に入力可能なもののみ上書き許容
 */
const state_error: inputState = {
  accept: [],
  overwrite: ["zero", "number", "one", "root", "minus"],
  renew: ["error"],
};

/**
 * 演算子系許容の雛形：直接使用しない
 */
const _state_accept_operators: inputState = {
  accept: ["percent", "muldiv", "plus", "minus", "calc"],
  overwrite: [],
  renew: ["error"],
};

/**
 * 演算子系許容：連続%は不可
 */
const state_percent: inputState = copyObject(_state_accept_operators);
removeItem(state_percent.accept, "percent");

/**
 * 演算子系許容：8桁いっぱいのとき指数表記も許容
 */
const state_digit_upper: inputState = copyObject(_state_accept_operators);
state_digit_upper.accept.push("exp");

/**
 * 演算子系許容：計算直後は計算実行不可
 */
const state_answer: inputState = copyObject(_state_accept_operators);
removeItem(state_answer.accept, "calc");
state_answer.renew.push("zero", "number", "one", "root");

/**
 * 指数表記のeの直後は+-のみ許容
 */
const state_exp: inputState = {
  accept: ["plus", "minus"],
  overwrite: [],
  renew: ["error"],
};

/**
 * stateNameからinputStateを呼び出す辞書
 *
 * the dictionary of formula state
 *
 * ```ts
 * state[key]
 * -> {accept:[type1, type2, ...],
 * overwrite:[type5, type6, ...]}
 * ```
 */
const state: { [key in stateName]: inputState } = {
  default: state_default,
  zero: state_zero,
  number: state_number,
  one: state_one,
  muldiv: state_muldiv,
  addsub: state_addsub,
  dot: state_dot,
  decimal: state_decimal,
  percent: state_percent,
  root: state_root,
  in_root: state_in_root,
  digit_upper: state_digit_upper,
  exp: state_exp,
  answer: state_answer,
  error: state_error,
} as const;

/**
 * 計算式文字列から空白を除去して返します。
 *
 * Get formula string by text content, replacing all spaces.
 * @param elm
 * @returns {string|null} formula string without spaces
 */
function getFormula(elm: HTMLElement): string | null {
  return elm.textContent?.replace(/\s/g, "") ?? null;
}
/**
 * 計算式の長さ（単位数）を返します。
 *
 * the length of  the formula counted by unit
 *
 *
 * @param {HTMLDivElement} elm
 * @returns {number} length of the formula
 */
const formulaFullLength: (elm: HTMLDivElement) => number = (
  elm: HTMLDivElement
) => {
  return elm.querySelectorAll("span").length;
};

/**
 * 計算式中の最後の数字ブロックの小数点を除いた桁数を返します。
 *
 * the length of last number block in the formula
 *
 * ```ts
 * const L= lastNumberLength("1+√144+1.2345");
 * //->5
 * ```
 *
 * @param {string} formula
 * @returns {number} length of last number block
 */
const lastNumberLength: (formula: string) => number = (formula: string) => {
  const match: RegExpMatchArray | null = formula.match(/([.0-9]+)/g);
  if (match) {
    return match[match.length - 1].replace(".", "").length;
  }
  return 0;
};

/**
 * 数式全体の内容（最後の数字ブロックの長さ）、数式の現在の状態、最新の入力によって決定される次の状態のマッピング\
 * ボタン入力gによっては常に対応する1つの状態へ遷移する場合がある
 *
 * Map of next state determined by current formula, current state, and last button input.\
 * Some buttonGroup always changes the current state into the particular one.
 *
 * @param l length of last number block in current formula string
 * @param c current state name
 * @param g button group which the last inputted button belongs to
 * @returns {stateName | "input" | undefined } mapped next state
 */
const stateMap: (
  l: number,
  c: stateName,
  g: buttonGroup
) => stateName | "input" | undefined = (
  l: number,
  c: stateName,
  g: buttonGroup
) => {
  if (l >= DIGIT_UPPER) {
    const dmap: { [current in stateName]?: stateName } = {
      number: "digit_upper",
      one: "digit_upper",
      decimal: "digit_upper",
      in_root: "digit_upper",
    };
    if (dmap[c]) {
      return dmap[c];
    }
  }

  const map: {
    [group in buttonGroup]: { [current in stateName]?: stateName } & {
      always?: stateName | "input";
      others?: "input";
    };
  } = {
    zero: {
      dot: "decimal",
      decimal: "decimal",
      in_root: "in_root",
      number: "number",
      one: "number",
      root: "zero",
      muldiv: "zero",
      addsub: "zero",
    },
    natural: {
      dot: "decimal",
      decimal: "decimal",
      root: "in_root",
      in_root: "in_root",
      others: "input",
    },
    state_changer: { always: "input" },
    plus_minus: { always: "addsub" },
    controller: {},
  };
  //優先順は常時 -> 個別定義 -> その他の場合
  return map[g]["always"] ?? map[g][c] ?? map[g]["others"];
};

/**
 * 現在の数式文字列と状態および最新のボタン入力から次に遷移する状態を判定します。\
 * 条件に応じて遷移先が異なる場合は```stateMap```で指定しておき、ボタン入力のみによって遷移先が決定する場合は```"input"```が返ってくるので```buttonType```を```stateName```に型変換して返します。指定がない場合は```"default"```を返します。
 *
 * Determine next state by condition of formula, current state and latest button input.\
 * The destinations are assigned in stateMap. If the destination is determined by the buttonInput only, ```stateMap``` returns ```input```, so this function returns buttonType converted into as stateName type.
 * If stateMap doesn't have mapped state in the condition, then returns ```"default"```.
 *
 * ```ts
 * const next = getNextstate("1+√2","root",{type:"number",value:"2"});
 * //->"in_root"
 * ```
 * @param {string} formula current formula (for 8 digit judgement)
 * @param {stateName} current current state
 * @param {buttonInput} input latest button input
 * @returns {stateName} next state
 */
function getNextState(
  formula: string,
  current: stateName,
  input: buttonType
): stateName {
  const len = lastNumberLength(formula);
  const grp = groupOfButton[input];
  const mappedState: stateName | "input" | undefined = stateMap(
    len,
    current,
    grp
  );

  if (mappedState === "input") {
    return input as stateName;
  }
  if (mappedState) {
    return mappedState;
  }
  return "default";
}

/**
 * ルート中の数字かどうかを判定します。要素自身が数字系で、かつ直前の要素がルート記号自体もしくはルート中の数字であればこの要素もルート中となります。
 *
 * Judgement wether the unit is under root symbol or not.
 * If the unit type is a kind of number and previous unit is root symbol itself or is in root, then the unit is in root.
 * @param {buttonType} type
 * @param {HTMLSpanElement} elm
 * @returns {boolean}
 */
const is_root: (type: buttonType, elm: HTMLSpanElement) => boolean = (
  type: buttonType,
  elm: HTMLSpanElement
) =>
  type === "root" ||
  ((elm?.dataset?.root === "true" || false) &&
    ["number", "one", "zero", "dot"].includes(type));

/**
 * 数式が計算すべき演算子系の文字を含むか判定します。
 *
 * Judgement wether the formula has operators to be calculated.
 * @param {string} formula current formula
 * @returns {boolean}
 */
const isToCalc: (formula: string) => boolean = (formula: string) =>
  /[+\-×÷√%]/g.test(formula.replace(/^\-/, ""));

/* == グローバル == */
/* 要素取得 */
const buttons = document.querySelectorAll(
  "button"
) as NodeListOf<HTMLButtonElement>;
const resultElm = document.getElementById("result") as HTMLDivElement;
const logElm = document.getElementById("log") as HTMLDivElement;

/* 状態管理 */
let current_state: stateName = "default";
const state_history: stateName[] = ["default"];

/* 入力 */
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const button_type: buttonType = btn.dataset.type as buttonType;
    const button_val: string | undefined = btn.dataset.val;

    if (button_val === "00") {
      inputUnitToFormula({ type: button_type, value: "0" });
      inputUnitToFormula({ type: button_type, value: "0" });
    } else if (typeof button_val === "string") {
      inputUnitToFormula({ type: button_type, value: button_val });
    }
  });
});

/**
 * 現在の状態を更新して状態履歴に加えます。
 *
 * Update current state and add it to the history.
 * @param {stateName} next name of state
 */
function updateState(next: stateName): void {
  current_state = next;
  state_history.push(current_state);
}

/**
 * 状態履歴から最新の履歴を削除して一つ前の状態に戻します。
 *
 * Remove the latest state from history and Go back to the previous state.
 */
function backState(): void {
  state_history.pop();
  if (state_history.length === 0) {
    updateState("default");
  } else {
    current_state = state_history[state_history.length - 1];
  }
}

/**
 * ボタン入力の内容を確認して数式に適用します。\
 * ボタンの機能は計算実行、リセット、1単位削除、入力のいずれかです。
 *
 * Check the function of button input and apply it to the formula.\
 * Each button has a function that process calculation, clear formula, delete the last unit, or add / replace a unit at the end of formula.
 *
 * @param {buttonInput} input button input
 */
function inputUnitToFormula(input: buttonInput): void {
  switch (input.type) {
    case "calc":
      calculateHandler();
      break;
    case "clear":
      resetCalculator();
      break;
    case "delete":
      if (formulaFullLength(resultElm) === 1) {
        resetCalculator();
      } else {
        overwriteLastUnit(resultElm, input);
        backState();
      }
      break;
    default:
      defaultInput(input);
      break;
  }
}

/**
 * 数式を```"0"```に、状態履歴をリセットして、現在の状態を```"default"```にします。
 *
 * Reset the formula to be "0", reset state history, and set current state to be "default".
 */
function resetCalculator(): void {
  resultElm.innerHTML = '<span class="calc-unit">0</span>';
  state_history.splice(0);
  updateState("default");
}

/**
 * 計算を実行
 *
 * process calculation
 */
function calculateHandler(): void {
  const formula = getFormula(resultElm);
  if (
    formula &&
    state[current_state].accept.includes("calc") &&
    isToCalc(formula)
  ) {
    const result_inputs: buttonInput[] = calculate(formula);

    logElm.innerHTML = `${resultElm.innerHTML}<span class="calc-unit">=</span>`;
    resetCalculator();

    result_inputs.forEach((ipt) => {
      inputUnitToFormula(ipt);
    });

    if (current_state !== "error") {
      state_history.pop();
      updateState("answer");
    }
  }
}

/**
 * 数式の末尾に入力値を追加するか、末尾の要素を入力値で置き換え、数式の状態を更新します。
 *
 * Add an input unit to the formula, or Replace last unit by input, then update state of formula.
 *
 * #### 判定例
 * current_stateによりstate辞書を参照し、renewに定義されていれば最初にリセットします。その後、overwriteに定義されていれば末尾を上書き、acceptに定義されていれば末尾に追加します。
 * ```
 * "1÷0" >> "エラー" -> "エラー" (state["zero"].renew.includes("error"))
 * "1+0" >> "1" -> "1+1" (state["zero"].overwrite.includes("number"))
 * "1+2" >> "3" -> "1+23" (state["number"].accept.includes("number"))
 * ```
 */
function defaultInput(input: buttonInput): void {
  let isInputted: boolean = false;
  const current_formula = getFormula(resultElm);
  if (typeof input.value !== "string" || current_formula === null) {
    return;
  }

  if (state[current_state].renew.includes(input.type)) {
    resetCalculator();
  }

  if (state[current_state].overwrite.includes(input.type)) {
    overwriteLastUnit(resultElm, input);
    backState();
    isInputted = true;
  } else if (state[current_state].accept.includes(input.type)) {
    const last_unit = resultElm.querySelector(
      "span:last-child"
    ) as HTMLSpanElement;
    resultElm.innerHTML += `<span class="calc-unit calc-unit--${
      input.type
    }" data-root="${is_root(input.type, last_unit)}">${input.value}</span>`;
    isInputted = true;
  }

  const new_formula = getFormula(resultElm);
  if (isInputted && new_formula !== null) {
    updateState(getNextState(new_formula, current_state, input.type));
  }
}

/**
 * 数式の末尾の要素を取得して新しい入力で置き換えます。
 *
 * get last unit(span element) of formula and replace it by the new input
 * @param {HTMLSpanElement} elm target to input
 * @param {buttonInput} ipt button input
 */
function overwriteLastUnit(elm: HTMLSpanElement, ipt: buttonInput): void {
  const last_unit = elm.querySelector("span:last-child") as HTMLSpanElement;
  last_unit.remove();
  if (ipt.value !== "") {
    elm.innerHTML += `<span class="calc-unit calc-unit--${
      ipt.type
    }" data-root="${is_root(ipt.type, last_unit)}">${ipt.value}</span>`;
  }
}

/**
 * 数式文字列を解析して数字と演算子の配列に分解し、計算を実行、結果の数値をボタン入力の配列に変換して返します。
 * これにより計算結果をそのまま使って次の計算を始められます。
 *
 * Parse the formula string into array of numbers and operators and Calculate the array formula, then Convert the answer to array of button input.\
 * This enable users to use the answer to next calculation same as usual number input.
 *
 * ```ts
 * const answers = calculate("1+2.14");
 * //->3.14
 *  -> [{type:"number",value:"3"},
 *      {type:"dot",value:"."},
 *      {type:"number",value:"1"},
 *      {type:"number",value:"4"}]
 * ```
 *
 * @param {string} formula inputted formula
 * @returns {buttonInput[]} calculation result number converted to array of button input
 */
function calculate(formula: string): buttonInput[] {
  /**
   * 指数表記 te+n は t×e+n、n√m の表記はn×√m、%は×0.01に正規化
   */
  const formatted: string = formula
    .replace(/e/g, "×e")
    .replace(/(\d)+√/g, "$1×√")
    .replace(/%/g, "×0.01");

  /**
   * 数字のブロックか演算子を要素とする配列
   */
  const commands: string[] = [];
  let tmp: string = formatted;
  while (tmp !== "") {
    const match = tmp.match(/(e[+-]\d+|\-?[0-9.√]+|[+-×÷])/);
    if (match) {
      tmp = tmp.replace(match[1], "");
      commands.push(match[1]);
    }
  }

  /**
   * ルートと指数表記だけ優先して計算した結果の配列
   */
  const rooted: string[] = commands.map((cmd) => {
    if (cmd[0] === "√") {
      return Math.sqrt(parseFloat(cmd.replace("√", ""))).toString();
    } else if (cmd[0] === "e") {
      const match = cmd.match(/e([+-])(\d+)/);
      if (match) {
        const sign = match[1];
        const dig = match[2];
        return (10 ** parseInt(sign + dig)).toString();
      }
      return cmd;
    } else {
      return cmd;
    }
  });

  /* 四則演算 */
  let answer: number = 0;
  let operator: string = "+";
  let is0div = false;
  let isError = false;
  rooted.forEach((cmd) => {
    let num: number = parseFloat(cmd);
    if (isNaN(num)) {
      operator = cmd;
    } else {
      switch (operator) {
        case "+":
          answer += num;
          break;
        case "-":
          answer -= num;
          break;
        case "×":
          answer *= num;
          break;
        case "÷":
          if (num === 0) {
            is0div = true;
          } else {
            answer /= num;
          }
          break;
        default:
          isError = true;
          break;
      }
    }
  });

  if (is0div) {
    console.error("0除算が入力されました");
    return [{ type: "error", value: "エラー" }];
  }
  if (isError) {
    console.error("予期せぬ演算子が入力されました");
    return [{ type: "error", value: "エラー" }];
  }

  const THRESHOLD = 0.01;
  const answer_abs = Math.abs(answer);

  /**
   * 下に丸めた時の誤差
   */
  const lower_error =
    answer_abs * 10 ** (DIGIT_UPPER - 1) -
    Math.floor(answer_abs * 10 ** (DIGIT_UPPER - 1));
  /**
   * 上に丸めた時の誤差
   */
  const upper_error =
    Math.ceil(answer_abs * 10 ** (DIGIT_UPPER - 1)) -
    answer_abs * 10 ** (DIGIT_UPPER - 1);
  /**
   * 計算結果の数値を8桁に丸めて指数表記化
   * * 絶対値1未満かつ9桁目より下が有意に大きい -> 指数表記
   * * 10^8より大きい -> 指数表記
   * * それ以外 -> 8桁に丸める
   *
   * （有意に大きい <=> 8桁で切り上げ/切り捨てした想定理想値との差分が両方とも閾値を超える）
   *
   * ```0.0100000003```
   * ->10^7倍が```100000.003```で理想値```100000```との差が小さいので丸め表示
   *
   * ```0.09999999999```
   * ->10^7倍が```9999999.999```で理想値```10000000```との差が小さいので丸め表示
   *
   *
   * 小数の末尾の連続0は省略
   */
  const answer_str: string = (
    (answer_abs < 1 && lower_error > THRESHOLD && upper_error > THRESHOLD) ||
    answer > 10 ** DIGIT_UPPER
      ? answer.toExponential(DIGIT_UPPER - 1)
      : answer.toPrecision(DIGIT_UPPER)
  )
    .replace(/((?<=\.\d+)|\.)0+$/, "")
    .replace(/(\d)\.0+(e[+-]\d+)/, "$1.0$2")
    .replace(/(\.\d*?[1-9])0+(e[+-]\d+)/, "$1$2");

  console.log(
    answer_str,
    answer_abs * 10 ** (DIGIT_UPPER - 1),
    Math.floor(answer_abs * 10 ** (DIGIT_UPPER - 1)),
    upper_error,
    lower_error,
    THRESHOLD
  );
  console.log(answer.toExponential(DIGIT_UPPER - 1));
  console.log(answer.toPrecision(DIGIT_UPPER));
  console.log(answer_str);

  const result: buttonInput[] = new Array(answer_str.length)
    .fill(null)
    .map((_, i) => {
      const t =
        answer_str[i] === "."
          ? "dot"
          : answer_str[i] === "0"
          ? "zero"
          : answer_str[i] === "e"
          ? "exp"
          : answer_str[i] === "+"
          ? "plus"
          : answer_str[i] === "-"
          ? "minus"
          : "number";
      return { type: t, value: answer_str[i] };
    });

  return result;
}

/* キーボード操作関連 */

/**
 * 各buttonTypeに属するキーボード入力の一覧\
 *
 * members(key) of each buttonType
 */
const keyInButtonType: { [key in buttonType]: string[] } = {
  zero: ["0"],
  number: ["2", "3", "4", "5", "6", "7", "8", "9"],
  one: ["1"],
  dot: ["."],
  percent: ["%"],
  root: ["r", "R"],
  muldiv: [":", "/", "*"],
  plus: [";", "+"],
  minus: ["-"],
  clear: ["c", "C"],
  delete: ["Backspace"],
  calc: ["Enter", "="],
  exp: [],
  error: [],
} as const;

/**
 * キーボード入力に対応するbuttonTypeの逆引き
 *
 * buttonType which each key belongs to
 */
const buttonTypeOfKey = reverseDictionary(keyInButtonType);

/**
 * キーボード入力に対応するbuttonInput.value用の入力文字列\
 * ```keyInButtonType```で定義した入力の揺れを正規化
 *
 * A string for buttonInput.value assigned to key input
 *
 * ```ts
 * ex)
 * ";" -> "+"
 * "*"　->　"×"
 * ```
 *
 * @param key ```keyDownEvent.key```
 * @returns string for ```buttonInput.value```
 */
const keyValue: (key: string) => string = (key: string) => {
  switch (key) {
    case "r":
      return "√";
    case "R":
      return "√";
    case ":":
      return "×";
    case "*":
      return "×";
    case "/":
      return "÷";
    case ";":
      return "+";
    case "Enter":
      return "";
    case "=":
      return "";
    case "c":
      return "";
    case "C":
      return "";
    case "Backspace":
      return "";
    default:
      return key;
  }
};

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey) {
    // 印刷や開発者ツールなど ⌘ / Ctrl系の入力はデフォルト動作を呼ぶ
    return;
  }

  e.preventDefault();

  const t: buttonType = buttonTypeOfKey[e.key];
  const v: string = keyValue(e.key);

  if (t) {
    const targetButton: HTMLButtonElement | undefined = Array.from(
      document.querySelectorAll<HTMLButtonElement>(`button[data-type="${t}"]`)
    ).find((elm) => elm.getAttribute("data-val") === v);

    targetButton?.focus();
    setTimeout(() => {
      targetButton?.blur();
    }, 200);
    inputUnitToFormula({ type: t, value: v });
  }
});
