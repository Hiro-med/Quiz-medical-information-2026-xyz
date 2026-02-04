// 1. 問題データ（ジャンルを分けて複数追加）
// さきほどコピーしたURLをここに貼り付け
//const spreadSheetUrl = "https://script.google.com/macros/s/AKfycbzS6z5-HGkLp_ty0lcXtqLgKw6QfYn1Jk1wejw8YdpH2Yubwtyc32gFAZmFNzZOvdga/exec";

let quizData = []; // 最初は空。スプレッドシートから読み込む
let filteredQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

//HTML要素の取得
const homeScreen = document.getElementById("home-screen");
const quizScreen = document.getElementById("quiz-screen");
const genreButtonsContainer = document.getElementById("genre-buttons");
const questionElement = document.getElementById("question");
const choicesContainer = document.getElementById("choices");
const feedbackElement = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const finishBtn = document.getElementById("finish-early-btn");

// CSVを読み込んでクイズデータに変換する関数
async function loadSpreadsheet() {
    
    console.log("読み込み開始...");
    const spreadSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6-3LlU5kiys75yOTUY3PRgvr-FJvRD8Rr2tzp7bxLwy7nlQEQb-rdUd2EX7065Jda2zdKeb7pijXK/pub?output=csv";

    try {
        const res = await fetch(spreadSheetUrl);
        if(!res.ok)throw new Error("ネットワーク応答が正常ではありません");
        
        const csvData = await res.text();
        
        // CSVを1行ずつ分解して配列にする処理
        const rows = csvData.split('\n').slice(1); // 1行目（ヘッダー）を飛ばす
        quizData = rows.map(row => {
            const cols = row.split(',').map(c => c.trim());
            return {
                genre: cols[1],
                question: cols[2],
                choices: [cols[3], cols[4], cols[5], cols[6], cols[7]],
                answer: parseInt(cols[8])-1,
                explanation: cols[9],
                image: cols[10] ? cols[10].trim():""
               
            };
        }).filter(q => q.genre)
        .sort(()=>Math.random()-0.5);
        console.log("読み込み成功:", quizData);
        // データの準備ができたらジャンルボタンを作成
        initGenreButtons(); 
    } catch(error){
        console.error("読み込みに失敗しました",error);
    }
}

// ページ読み込み時に実行
loadSpreadsheet();

// ジャンルボタンを作る処理を独立した関数にする
function initGenreButtons() {
    const container = document.getElementById("genre-buttons");
    if (!container) {
        console.error("genre-buttonsが見つかりません");
        return;
    }

    container.innerHTML = "";
    
    //まず「全ジャンル」ボタンを一番上に作成
    const allBtn = document.createElement("button");
    allBtn.className = "mode-btn all-genre-btn"; // 他のボタンと同じ大きく綺麗なデザイン
    allBtn.innerText = "全ジャンルから出題";
    allBtn.onclick = () => startQuiz("all"); // "all" という特別なキーワードを渡す
    container.appendChild(allBtn);
    
    //genreButtonsContainer.innerHTML = ""; // 一旦中身を空にする
    const genres = [...new Set(quizData.map(q => q.genre))]; 
    
    genres.forEach(genre => {
        const btn = document.createElement("button");
        btn.className = "mode-btn";
        btn.innerText = genre;
        btn.classList.add("genre-btn");
        btn.onclick = () => startQuiz(genre);
        genreButtonsContainer.appendChild(btn);
    });
}

let currentMode = ""; // "10questions" か "endless" を入れる
let questionLimit = 0; // 最大出題数

function setMode(mode) {
    currentMode = mode;
    questionLimit = (mode === "10questions") ? 10 : filteredQuestions.length;
    
    const modeScreen = document.getElementById("mode-selection");
    const homeScreen = document.getElementById("home-screen");
    
    if (modeScreen && homeScreen) {
        modeScreen.classList.add("hidden");    // モード選択を隠す
        homeScreen.classList.remove("hidden"); // ジャンル選択を出す
        console.log("モード選択完了:", mode);
    } else {
        console.error("画面のIDが見つかりません。HTMLを確認してください。");
    }

}


// 3. クイズ開始
function startQuiz(selectedGenre) {
    console.log("選択されたジャンル:", selectedGenre);
    if(selectedGenre === "all"){
        // 「全ジャンル」の場合は、quizData をそのままコピーする
        filteredQuestions = [...quizData];
    } else {// 指定されたジャンルの問題だけを抽出
    filteredQuestions = quizData.filter(q => q.genre === selectedGenre);
    }
    
    // 出題リストをシャッフル（10問モードなら先頭10問がランダムに選ばれる状態にする）
    filteredQuestions.sort(() => Math.random() - 0.5);
   
    // モードに応じた問題数の設定
    if (currentMode === '10questions') {
        questionLimit = Math.min(10, filteredQuestions.length);
    } else {
        questionLimit = filteredQuestions.length;
    }
    
    // 数値をリセット
    currentQuestionIndex = 0;
    score = 0;
    
    // 画面の切り替え
    document.getElementById("home-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");
    
    
    // 最初の問題を表示
    showQuestion();
}

// 4. 問題表示
function showQuestion() {
    // 画面のリセット
    feedbackElement.innerText = "";
    document.getElementById("explanation-container").classList.add("hidden"); // ★解説を隠す
    nextBtn.classList.add("hidden");
    nextBtn.style.display = "none";

    // データの取得
    const q = filteredQuestions[currentQuestionIndex];
    
    if (!q) {
        console.error("問題データが見つかりません");
        return;
    }
    console.log("現在の問題データ:", q); // ←これを確認
    
    // 表示のリセット：一旦どちらも隠す
    nextBtn.style.display = "none";
    //restartBtn.style.display = "none";
    // 中断ボタンを元のテキストに戻す
    const finishBtn = document.getElementById("finish-early-btn");
    if (finishBtn) finishBtn.innerText = "終了して結果を見る";

    // 問題文の表示
    document.getElementById("question").innerText = `Q${currentQuestionIndex + 1}: ${q.question}`;
    //document.getElementById("genre-label").innerText = `ジャンル: ${q.genre}`;
    //document.getElementById("progress").innerText = `${currentQuestionIndex + 1} / ${filteredQuestions.length}`;
    //questionElement.innerText = q.question;
    //document.getElementById("question").innerText = `Q${currentQuestionIndex + 1} [${q.genre}]: ${q.question}`;
    
    // --- 画像の処理を追加 ---
    const imageContainer = document.getElementById("question-image-container");
    const questionImg = document.getElementById("question-image");

    if (q.image && q.image.trim() !== "") {
        questionImg.src = q.image; // スプレッドシートのURLをセット
        imageContainer.classList.remove("hidden"); // 画像枠を表示
    } else {
        imageContainer.classList.add("hidden"); // 画像がない時は隠す
    }

    choicesContainer.innerHTML = "";
    q.choices.forEach((choice, i) => {
        const btn = document.createElement("button");
        btn.innerText = choice;
        btn.classList.add("choice-btn");
        btn.onclick = () => checkAnswer(i);
        choicesContainer.appendChild(btn);
    });
}

// 5. 正誤判定
function checkAnswer(idx) {
    const q = filteredQuestions[currentQuestionIndex];
    const buttons = choicesContainer.getElementsByTagName("button");
    for (let b of buttons) b.disabled = true;
document.getElementById("question").innerText = `Q${currentQuestionIndex + 1} [${q.genre}]: ${q.question}`;
    // 正誤判定の表示
    if (idx === q.answer) {
        feedbackElement.innerText = "〇 正解！";
        feedbackElement.style.color = "green";
        score++;
    } else {
        feedbackElement.innerText = `× 不正解（正解: ${q.choices[q.answer]}）`;
        feedbackElement.style.color = "red";
    }
    
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        if (i === q.answer) {
            buttons[i].style.backgroundColor = "#d4edda"; // 正解を薄緑に
            buttons[i].style.borderColor = "#28a745";
        }
        if (i === idx && i !== q.answer) {
            buttons[i].style.backgroundColor = "#f8d7da"; // 間違えた選択肢を薄赤に
            buttons[i].style.borderColor = "#dc3545";
        }
    }
    // ★解説文を表示する処理を追加
    const expContainer = document.getElementById("explanation-container");
    const expText = document.getElementById("explanation-text");
    
    expText.innerText = q.explanation || "解説はありません。"; // 解説がない場合の予備表示
    expContainer.classList.remove("hidden"); // 解説エリアを表示
    

// 終了判定
    if (currentQuestionIndex + 1 < questionLimit) {
        // まだ次がある場合
        const nextBtn = document.getElementById("next-btn");
        if(nextBtn){
            nextBtn.style.setProperty("display", "block", "important");
            console.log("次の問題ボタンを表示しました"); // 動作確認用
            finishBtn.innerText = "終了して結果を見る";
            finishBtn.style.backgroundColor = ""; // 元の色（CSS）に戻す}
        }else{
            console.error("next-btnというIDのボタンが見つかりません")
        }
    } else {
         // 10問目（最後）の場合
        const finishBtn = document.getElementById("finish-early-btn");    
        nextBtn.style.display = "none"; 
        if(finishBtn){
            finishBtn.innerText = "結果を表示する";
            finishBtn.style.backgroundColor = "#ffc507"; // 終了を強調する色に
            finishBtn.style.color = "#ffffff";
            finishBtn.style.display = "block";
        }
      }
    }

// 【追加】ホーム（モード選択）に戻る関数
function goToHome() {
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("mode-selection").classList.remove("hidden");
}

nextBtn.onclick = () => {
    currentQuestionIndex++;

    showQuestion();
};

/*restartBtn.onclick = () => {
    quizScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");

    // 問題追加ボタンを再表示する
    document.getElementById("add-question-container").style.display = "block";

};*/

function showResult() {
  // 1. 画面の切り替え
    quizScreen.classList.add("hidden");
    const resultScreen = document.getElementById("result-screen");
    if(resultScreen){
        resultScreen.classList.remove("hidden");
    }else{
        console.error("result-screenが見つかりません");
    }
    // 2. 問題追加ボタンを再表示（もしあれば）
    const addBtn = document.getElementById("add-question-container");
    if (addBtn) addBtn.style.display = "block";

    // 3. スコア計算
    // 回答済みの場合は今の番号+1、まだ選んでいないなら今の番号を「解いた数」にする
    const solvedCount = feedbackElement.innerText === "" ? currentQuestionIndex : currentQuestionIndex + 1;
    
    if (solvedCount === 0) {
        document.getElementById("result-detail").innerHTML = "<p>まだ問題を解いていません。</p>";
        return;
    }

    const percent = Math.round((score / solvedCount) * 100);
    
    // ランク判定
    let rank = "";
    if (percent === 100) rank = "🏆";
    else if (percent >= 80) rank = "✨";
    else if (percent >= 60) rank = "!!";
    else rank = "📚";

    // 4. 結果画面を書き換える
    document.getElementById("result-detail").innerHTML = `
        <p style="font-size: 1.1rem; color: #666;">モード: ${currentMode === "10questions" ? "10問限定" : "エンドレス"}</p>
        <div style="margin: 20px 0;">
            <span style="font-size: 3rem; font-weight: bold; color: #007bff;">${percent}</span><span style="font-size: 1.5rem;"> 点</span>
        </div>
        <p style="font-size: 1.2rem;">正解数: ${score} / ${solvedCount} 問</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 1.3rem; font-weight: bold;">${rank}</p>
    `;
}

if (finishBtn) {
    finishBtn.onclick = showResult; // HTMLのonclick属性を上書きして確実に繋ぐ
}