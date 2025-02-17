<template>
  <div id="app">

    <button @click="triggerFileSelect" class="select - file - btn">选择文件</button>
    <span class="file - name - display">{{ selectedFileName }}</span>
    <!-- 上传文件按钮 -->
    <input type="file" @change="uploadFile" id="fileInput" style="display: none;">

    <button @click="uploadFile" class="upload-btn">上传文件</button>
    <!-- 下载文件按钮 -->
    <button @click="downloadFile" :disabled="!expressionResults.length" class="download-btn">下载文件</button>


    <div class="calculator" v-show="show1">
      <div class="result" style="grid-area: result">{{ equation }}</div>
      <button style="grid-area: s" @click="append('sin(')" class="operator">sin</button>
      <button style="grid-area: c" @click="append('cos(')" class="operator">cos</button>
      <button style="grid-area: t" @click="append('tan(')" class="operator">tan</button>
      <button style="grid-area: l" @click="append('(')" class="operator">(</button>
      <button style="grid-area: r" @click="append(')')" class="operator">)</button>
      <button style="grid-area: g" @click="append('%')" class="operator">%</button>
      <button style="grid-area: ans" @click="getLast()" class="special">ans</button>
      <button style="grid-area: del" @click="deleteLastCharacter()" class="special">DEL</button>
      <button style="grid-area: ac" @click="clear()" class="special">AC</button>
      <button style="grid-area: add" @click="append('+')" class="operator">+</button>
      <button style="grid-area: subtract" @click="append('-')" class="operator">-</button>
      <button style="grid-area: multiply" @click="append('*')" class="operator">*</button>
      <button style="grid-area: divide" @click="append('/')" class="operator">/</button>
      <button style="grid-area: equal" @click="calculate()" class="special">=</button>
      <button style="grid-area: number-1" @click="append('1')" class="number">1</button>
      <button style="grid-area: number-2" @click="append('2')" class="number">2</button>
      <button style="grid-area: number-3" @click="append('3')" class="number">3</button>
      <button style="grid-area: number-4" @click="append('4')" class="number">4</button>
      <button style="grid-area: number-5" @click="append('5')" class="number">5</button>
      <button style="grid-area: number-6" @click="append('6')" class="number">6</button>
      <button style="grid-area: number-7" @click="append('7')" class="number">7</button>
      <button style="grid-area: number-8" @click="append('8')" class="number">8</button>
      <button style="grid-area: number-9" @click="append('9')" class="number">9</button>
      <button style="grid-area: number-0" @click="append('0')" class="number">0</button>
      <button style="grid-area: dot" @click="append('.')" class="number">.</button>
    </div>
  </div>
</template>
<script>

export default {
  data() {
    return {
      show1: true,
      show2: false,
      up_btn: "基本计算器",
      equation: "0",
      isDecimalAdded: false,
      isOperatorAdded: false,
      isStarted: false,
      isError: false,//判断是否为一个错误信息
      flag: false,//用于判断是否是一个新的表达式

      expressionResults: [], // 存储表达式及其求值结果
      selectedFileName: "",  // 存储选中的文件名
    };
  },
  methods: {

    triggerFileSelect() {
      document.getElementById('fileInput').click();
    },

    uploadFile(event) {
      if (event.target && event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        this.selectedFileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent = e.target.result;
          const expressions = fileContent.split('\n').filter(expression => expression.trim()!== '');
          this.expressionResults = [];
          expressions.forEach((expression) => {
            const result = this.evaluateExpression(expression);
            this.expressionResults.push({ expression, result });
          });
        };
        reader.readAsText(file);
      }
    },
    downloadFile() {
      // 处理下载文件逻辑
      let content = '';
      this.expressionResults.forEach(({ expression, result }) => {
        content += `${expression} = ${result}\n`;
      });
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'expression_results.txt';
      link.click();
      URL.revokeObjectURL(url);
    },


    getLast() {
      if(this.isError == true){
        this.equation += '';
      }
      else {
        console.log("lastResult");
        const storedData = localStorage.getItem('lastResult');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log(parsedData);
          if (this.equation === "0") {
            this.equation = parsedData.result;
          }
          else if (parsedData.result === "Error") {
            this.equation = "Error";
          }
          else {
            this.equation += parsedData.result;
          }
        }
      }
    },
    append(character) {
      if(this.flag == true){
        this.equation = '';
        this.flag = false;
      }
      if (this.isOperator(character)) {
        this.equation += character;
        this.isDecimalAdded = false;
        this.isOperatorAdded = true;
      } else {
        if (this.equation === "0" && character !== ".") {
          this.equation = "";
        }
        if (character === ".") {
          if (!this.isDecimalAdded) {
            this.equation += character;
            this.isDecimalAdded = true;
          }
        } else {
          this.equation += character;
        }
        this.isOperatorAdded = false;
      }
    },
    deleteLastCharacter() {
      if (this.equation.length > 1) {
        this.equation = this.equation.slice(0, -1);
      } else {
        this.equation = "0";
        this.isDecimalAdded = false;
        this.isOperatorAdded = false;
        this.isStarted = false;
      }
    },

    // 定义运算符优先级
    precedence(operator) {
      switch (operator) {
        case '+':
        case '-':
          return 1;
        case '*':
        case '/':
        case '%':
          return 2;
        case 'sin':
        case 'cos':
        case 'tan':
          return 3;
        default:
          return 0;
      }
    },

    // 中缀表达式转后缀表达式
    infixToPostfix(expression) {
      const operatorStack = [];
      const outputStack = [];
      const tokens = expression.match(/\d+|[+\-*/%()]|sin|cos|tan|sqrt/g);

      if (!tokens) {
        throw new Error('无效的输入：表达式中包含非法字符');
      }

      let openBrackets = 0;
      for (let token of tokens) {
        if (/^\d+$/.test(token)) {
          // 如果是操作数，直接输出
          outputStack.push(token);
        } else if (token === '(') {
          // 左括号直接入栈
          operatorStack.push(token);
          openBrackets++;
        } else if (token === ')') {
          // 右括号，弹出操作符直到遇到左括号
          if (openBrackets === 0) {
            throw new Error('括号不匹配：右括号多余');
          }
          while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
            outputStack.push(operatorStack.pop());
          }
          if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1] !== '(') {
            throw new Error('括号不匹配：未找到匹配的左括号');
          }
          operatorStack.pop(); // 弹出左括号
          openBrackets--;
        } else if (['+', '-', '*', '/', '%', 'sin', 'cos', 'tan', 'sqrt'].includes(token)) {
          // 操作符，比较优先级
          while (
            operatorStack.length > 0 &&
            this.precedence(operatorStack[operatorStack.length - 1]) >= this.precedence(token)
          ) {
            outputStack.push(operatorStack.pop());
          }
          operatorStack.push(token);
        } else {
          throw new Error(`无效的运算符：${token}`);
        }
      }
      console.log(2);
      if (openBrackets !== 0) {
        throw new Error('括号不匹配：左括号多余');
      }

      // 弹出剩余的操作符
      while (operatorStack.length > 0) {
        outputStack.push(operatorStack.pop());
      }

      return outputStack;
    },

    // 后缀表达式求值
    evaluatePostfix(postfix) {
      const valueStack = [];
      console.log(3);
      for (let token of postfix) {
        if (/^\d+$/.test(token)) {
          // 操作数入栈
          valueStack.push(parseFloat(token));
        } else {
          // 操作符，根据操作符类型处理
          switch (token) {
            case '+':
              if (valueStack.length < 2) {
                throw new Error('操作数缺失：加法运算符缺少操作数');
              }
              const rightAdd = valueStack.pop();
              const leftAdd = valueStack.pop();
              valueStack.push(leftAdd + rightAdd);
              break;
            case '-':
              if (valueStack.length < 2) {
                throw new Error('操作数缺失：减法运算符缺少操作数');
              }
              const rightSub = valueStack.pop();
              const leftSub = valueStack.pop();
              valueStack.push(leftSub - rightSub);
              break;
            case '*':
              if (valueStack.length < 2) {
                throw new Error('操作数缺失：乘法运算符缺少操作数');
              }
              const rightMul = valueStack.pop();
              const leftMul = valueStack.pop();
              valueStack.push(leftMul * rightMul);
              break;
            case '/':
              if (valueStack.length < 2) {
                throw new Error('操作数缺失：除法运算符缺少操作数');
              }
              const rightDiv = valueStack.pop();
              const leftDiv = valueStack.pop();
              if (rightDiv === 0) {
                throw new Error('除数为零');
              }
              valueStack.push(leftDiv / rightDiv);
              break;

            case '%':
              if (valueStack.length < 2) {
                throw new Error('操作数缺失：取模运算符缺少操作数');
              }
              const rightMod = valueStack.pop();
              const leftMod = valueStack.pop();
              if (rightMod === 0) {
                throw new Error('模数为零');
              }
              valueStack.push(leftMod % rightMod);
              break;

            case 'sin':
              if (valueStack.length < 1) {
                throw new Error('操作数缺失:sin 运算符缺少操作数');
              }
              const sinOperand = valueStack.pop();
              valueStack.push(Math.sin(sinOperand));
              break;
            case 'cos':
              if (valueStack.length < 1) {
                throw new Error('操作数缺失:cos 运算符缺少操作数');
              }
              const cosOperand = valueStack.pop();
              valueStack.push(Math.cos(cosOperand));
              break;
            case 'tan':
              if (valueStack.length < 1) {
                throw new Error('操作数缺失:tan 运算符缺少操作数');
              }
              const tanOperand = valueStack.pop();
              valueStack.push(Math.tan(tanOperand));
              break;
            case 'sqrt':
              if (valueStack.length < 1) {
                throw new Error('操作数缺失:sqrt 运算符缺少操作数');
              }
              const sqrtOperand = valueStack.pop();
              if (sqrtOperand < 0) {
                throw new Error('负数不能开平方根');
              }
              valueStack.push(Math.sqrt(sqrtOperand));
              break;
          }
        }
      }

      if (valueStack.length !== 1) {
        throw new Error('操作数缺失：表达式求值后栈中元素数量不为 1');
      }

      return valueStack.pop();
    },

    // 计算表达式的值
    evaluateExpression(expression) {
      try {
        const postfix = this.infixToPostfix(expression);
        var res = this.evaluatePostfix(postfix);
        console.log(res);
        return res;
      } catch (error) {
        console.error(error.message);
        return error;//return null;
      }
    },
    
    calculate() {
      try {
        this.flag = true;
        const res = this.evaluateExpression(this.equation);
        var result;
        if(res instanceof Error){
          this.isError = true;
          throw res;
        }
        else{
          result = res.toFixed(3);
          this.isError = false;
        }
        // if (isNaN(result)) {
        //   throw new Error("Invalid expression");
        // }
        //创建对象，可以放到localStorage里面存储
        const dataToStore = {
          equation: this.equation,
          result: result.toString()
        };
        //存储到localStorage，注意要先转化为字符串
        localStorage.setItem('lastResult', JSON.stringify(dataToStore));
        this.equation = result.toString();
      } catch (error) {
        console.error(error);
        /*//创建对象，可以放到localStorage里面存储
        const errorDataToStore = {
          equation: this.equation,
          result: error.message
        };
        //存储到localStorage，注意要先转化为字符串
        localStorage.setItem('lastResult', JSON.stringify(errorDataToStore));*/
        this.equation = error.message;
      }
    },
    clear() {
      this.equation = "0";
      this.isDecimalAdded = false;
      this.isOperatorAdded = false;
      this.isStarted = false;
    },
    isOperator(character) {
      return ["+", "-", "*", "/"].includes(character);
    },
  },
};
</script>


<style>
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;

  background-color: #eee;
}

.rate_calculator {
  display: grid;
  grid-template-areas:
    "t1 t2"
    "t3 t4"
    "t5 t6"
    "t7 t8"
    "t9 t10"
    "t11 t12";
}

.calculator {
  --button-width: 100px;
  --button-height: 85px;
  display: grid;
  grid-template-areas:
    "result result result result result"
    "s l r del ac"
    "c number-7 number-8 number-9 divide"
    "t number-4 number-5 number-6 multiply"
    "g number-1 number-2 number-3 subtract"
    "ans number-0 dot equal add";
  grid-template-columns: repeat(5, var(--button-width));
  grid-template-rows: repeat(6, var(--button-height));
  /* box-shadow: -8px -8px 16px -10px rgba(255, 255, 255, 1),
    8px 8px 16px -10px rgba(0, 0, 0, 0.15); */
  background-color: #f0f0f0; /* 背景颜色 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* 阴影效果 */
  padding: 20px;
  border-radius: 10px;
  padding: 24px;
  border-radius: 20px;
}

.calculator button {
  margin: 7px;
  padding: 0;
  border: 0;
  display: block;
  outline: none;
  border-radius: calc(var(--button-height) / 3);
  font-size: 24px;
  /* font-family: Helvetica; */
  font-family: Arial, sans-serif;
  font-weight: normal;
  /* color: #999;
  background: linear-gradient(135deg,
      rgba(230, 230, 230, 1) 0%,
      rgba(246, 246, 246, 1) 100%);
  box-shadow: -4px -4px 10px -8px rgba(255, 255, 255, 1),
    4px 4px 10px -8px rgba(0, 0, 0, 0.3); */
  color: #333;
  background-color: #e0e0e0; /* 按钮背景颜色 */
  transition: background-color 0.2s ease;
}

.calculator button:active {
  box-shadow: -4px -4px 10px -8px rgba(255, 255, 255, 1) inset,
    4px 4px 10px -8px rgba(0, 0, 0, 0.3) inset;
}

.result {
  text-align: right;
  line-height: var(--button-height);
  font-size: 44px;
  font-family: Helvetica;
  padding: 0 30px;
  /* color: #666; */
  color: #333;

  overflow-x: auto; /* 添加横向滚动条 */
  white-space: nowrap; /* 防止换行 */
  overflow-y: hidden;

}





/* 数字按钮 */
.calculator button.number {
  background-color: #f5f5f5;
}
/* 运算符按钮 */
.calculator button.operator {
  background-color: #f0a500;
  color: #fff;
}
/* 特殊按钮，如AC、DEL等 */
.calculator button.special {
  background-color: #e0e0e0;
}

.upload-btn,
.download-btn {
  padding: 8px 16px;
  margin-left: 10px;
  /* border: 1px solid #007bff; */
  border-radius: 4px;
  background-color: white;
  color: #007bff;
  cursor: pointer;
  transition: background - color 0.3s ease;
}
.upload-btn:hover,
.download-btn:hover {
  background-color: #007bff;
  color: white;
}


.select-file-btn {
  padding: 8px 16px;
  border: 1px solid #007bff;
  border-radius: 4px;
  background-color: white;
  color: #007bff;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.select-file-btn:hover {
  background-color: #007bff;
  color: white;
}
.file-name-display {
  margin-left: 30px;
  line-height: 32px;
}
</style>
