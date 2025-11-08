// app.js - Playful Chess web UI logic (client-side)
// - Hotseat 2-player game
// - Move validation implemented locally (no engine)
// - Promotion to Queen, undo, move history, flip

const boardEl = document.getElementById('board');
const movesList = document.getElementById('movesList');
const turnPlayer = document.getElementById('turnPlayer');
const statusEl = document.getElementById('status');
const btnNew = document.getElementById('btnNew');
const btnUndo = document.getElementById('btnUndo');
const btnFlip = document.getElementById('btnFlip');
const orientationSel = document.getElementById('orientation');
const promotionModal = document.getElementById('promotion');

let board = [];
let whiteTurn = true;
let history = [];
let selected = null;
let orientation = 'white';

const glyph = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

function initBoard(){
  board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
  whiteTurn = true; history = []; selected = null; render(); updateUI();
}

function render(){
  // clear
  boardEl.innerHTML = '';
  const squares = [];
  const order = orientation === 'white' ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const files = orientation === 'white' ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  for(let r of order){
    for(let c of files){
      const sq = document.createElement('div');
      sq.className = `square ${(r+c)%2? 'dark':'light'}`;
      sq.dataset.r = r; sq.dataset.c = c;
      const piece = board[r][c];
      if(piece !== '.'){
        const p = document.createElement('div'); p.className='piece';
        p.textContent = glyph[piece] || piece;
        sq.appendChild(p);
      }
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
      squares.push(sq);
    }
  }
}

function updateUI(){
  turnPlayer.textContent = whiteTurn ? 'White' : 'Black';
  movesList.innerHTML = '';
  for(let i=0;i<history.length;i++){
    const li = document.createElement('li'); li.textContent = history[i]; movesList.appendChild(li);
  }
}

function parseSquareStr(s){
  if(!s || s.length!==2) return null;
  const file = s.charCodeAt(0) - 97; // a->0
  const rank = 8 - parseInt(s[1],10);
  return {r: rank, c: file};
}

function algebraic(r,c){
  return String.fromCharCode(97+c) + (8-r);
}

function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8 }

function pieceAt(pos){ return board[pos.r][pos.c] }
function isWhite(ch){ return ch>='A' && ch<='Z' }
function isBlack(ch){ return ch>='a' && ch<='z' }
function isSameSide(a,b){ if(a==='.'||b==='.') return false; return (isWhite(a)&&isWhite(b))||(isBlack(a)&&isBlack(b)) }

function isPathClear(a,d){
  const dr = d.r > a.r ? 1 : (d.r < a.r ? -1 : 0);
  const dc = d.c > a.c ? 1 : (d.c < a.c ? -1 : 0);
  let r = a.r + dr, c = a.c + dc;
  while(r!==d.r || c!==d.c){ if(board[r][c] !== '.') return false; r+=dr; c+=dc }
  return true;
}

function validPawnMove(src,dst,p){
  const dir = isWhite(p) ? -1 : 1;
  const startRow = isWhite(p) ? 6 : 1;
  const tgt = pieceAt(dst);
  if(dst.c === src.c){
    if(dst.r === src.r + dir && tgt === '.') return true;
    if(src.r === startRow && dst.r === src.r + 2*dir && tgt === '.'){
      const mid = {r: src.r + dir, c: src.c}; if(board[mid.r][mid.c]==='.') return true;
    }
  }
  if(Math.abs(dst.c - src.c) === 1 && dst.r === src.r + dir && tgt !== '.'){
    if(isWhite(p) && isBlack(tgt)) return true; if(isBlack(p) && isWhite(tgt)) return true;
  }
  return false;
}

function validKnightMove(s,d){ const dr=Math.abs(s.r-d.r), dc=Math.abs(s.c-d.c); return (dr===1&&dc===2)||(dr===2&&dc===1) }
function validKingMove(s,d){ return Math.max(Math.abs(s.r-d.r), Math.abs(s.c-d.c)) === 1 }
function validBishopMove(s,d){ if(Math.abs(s.r-d.r)!==Math.abs(s.c-d.c)) return false; return isPathClear(s,d) }
function validRookMove(s,d){ if(s.r!==d.r && s.c!==d.c) return false; return isPathClear(s,d) }
function validQueenMove(s,d){ return validBishopMove(s,d) || validRookMove(s,d) }

function validMove(src,dst,whiteTurn){
  if(!inBounds(src.r,src.c) || !inBounds(dst.r,dst.c)) return false;
  const p = pieceAt(src); if(p==='.') return false;
  if(whiteTurn && !isWhite(p)) return false; if(!whiteTurn && !isBlack(p)) return false;
  const tgt = pieceAt(dst); if(isSameSide(p,tgt)) return false;
  const up = p.toUpperCase();
  switch(up){
    case 'P': return validPawnMove(src,dst,p);
    case 'N': return validKnightMove(src,dst);
    case 'K': return validKingMove(src,dst);
    case 'B': return validBishopMove(src,dst);
    case 'R': return validRookMove(src,dst);
    case 'Q': return validQueenMove(src,dst);
  }
  return false;
}

function movePiece(src,dst){
  const p = board[src.r][src.c];
  board[dst.r][dst.c] = board[src.r][src.c];
  board[src.r][src.c] = '.';
  if(p.toUpperCase()==='P'){
    if(isWhite(p) && dst.r===0) board[dst.r][dst.c] = 'Q';
    if(isBlack(p) && dst.r===7) board[dst.r][dst.c] = 'q';
  }
}

function kingExists(white){ const target = white ? 'K' : 'k'; for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]===target) return true; return false }

function onSquareClick(e){
  const r = parseInt(this.dataset.r,10), c = parseInt(this.dataset.c,10);
  const pos = {r,c};
  if(selected){
    // try move
    if(selected.r===pos.r && selected.c===pos.c){ selected=null; clearHighlights(); render(); return }
    if(validMove(selected,pos,whiteTurn)){
      const captured = board[pos.r][pos.c];
      // push history
      history.push(`${algebraic(selected.r,selected.c)} ${algebraic(pos.r,pos.c)}`);
      movePiece(selected,pos);
      // playful comment to status
      statusEl.textContent = captured !== '.' ? `${whiteTurn? 'White':'Black'} captured '${captured}'` : '';
      if(!kingExists(true)){ statusEl.textContent = 'Black captured White\'s king. Black wins!'; render(); return }
      if(!kingExists(false)){ statusEl.textContent = 'White captured Black\'s king. White wins!'; render(); return }
      selected=null; whiteTurn=!whiteTurn; updateUI(); render();
    } else {
      // select another piece if valid
      if(board[pos.r][pos.c] !== '.' && !isSameSide(board[pos.r][pos.c], whiteTurn? 'P':'p')){
        // do nothing
      }
      if(board[pos.r][pos.c] !== '.' && ((whiteTurn && isWhite(board[pos.r][pos.c])) || (!whiteTurn && isBlack(board[pos.r][pos.c])))){
        selected = pos; clearHighlights(); highlightMoves(pos); render();
      } else {
        statusEl.textContent = 'Illegal move. Try again.';
      }
    }
  } else {
    // no selection yet; pick piece
    if(board[pos.r][pos.c] === '.') return;
    const piece = board[pos.r][pos.c];
    if(whiteTurn && !isWhite(piece)) return; if(!whiteTurn && !isBlack(piece)) return;
    selected = pos; clearHighlights(); highlightMoves(pos); render();
  }
}

function clearHighlights(){
  boardEl.querySelectorAll('.square').forEach(s=>{ s.classList.remove('highlight','capture','selected') });
}

function highlightMoves(src){
  const sqs = boardEl.querySelectorAll('.square');
  for(let el of sqs){
    const r = parseInt(el.dataset.r,10), c = parseInt(el.dataset.c,10);
    const dst = {r,c};
    if(src.r===r && src.c===c){ el.classList.add('selected') }
    if(validMove(src,dst,whiteTurn)){
      const tgt = board[r][c]; el.classList.add(tgt === '.' ? 'highlight' : 'capture');
    }
  }
}

btnNew.addEventListener('click', ()=>{ initBoard(); statusEl.textContent=''; })
btnUndo.addEventListener('click', ()=>{
  // naive undo: reset and replay all moves except last
  if(history.length===0) return; history.pop(); const moves = [...history]; initBoard(); history = [];
  for(let mv of moves){ const [s,t] = mv.split(' '); const src = parseSquareStr(s); const dst = parseSquareStr(t); movePiece(src,dst); history.push(mv); whiteTurn = !whiteTurn }
  updateUI(); render();
})
btnFlip.addEventListener('click', ()=>{ orientation = orientation==='white'?'black':'white'; render(); })
orientationSel.addEventListener('change', (e)=>{ orientation = e.target.value; render(); })

// On-load
initBoard();
updateUI();
