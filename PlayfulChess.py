#!/usr/bin/env python3
"""
PlayfulChess.py

Simple, playful console chess for two local players.
- Move format: e2 e4
- Basic move legality (no castling, no en-passant)
- Pawn promotion to queen
- King capture ends the game

Run: python PlayfulChess.py
"""
from typing import Tuple

Board = list

def init_board() -> Board:
    return [list(r) for r in [
        'rnbqkbnr',
        'pppppppp',
        '........',
        '........',
        '........',
        '........',
        'PPPPPPPP',
        'RNBQKBNR',
    ]]

def print_board(b: Board) -> None:
    print('\n    a b c d e f g h')
    for r in range(8):
        print(8-r, '  ', end='')
        for c in range(8):
            ch = b[r][c]
            print(ch if ch != '.' else '.', end=' ')
        print(' ', 8-r)
    print('    a b c d e f g h\n')

def parse_square(s: str) -> Tuple[int,int]:
    if len(s) != 2: return (-1,-1)
    c = ord(s[0]) - ord('a')
    r = 8 - int(s[1])
    return (r,c)

def in_bounds(r:int,c:int) -> bool:
    return 0 <= r < 8 and 0 <= c < 8

def piece_at(b:Board, pos: Tuple[int,int]) -> str:
    r,c = pos
    if not in_bounds(r,c): return '\0'
    return b[r][c]

def is_white(ch: str) -> bool:
    return 'A' <= ch <= 'Z'

def is_black(ch: str) -> bool:
    return 'a' <= ch <= 'z'

def is_same_side(a: str, b: str) -> bool:
    if a == '.' or b == '.': return False
    return (is_white(a) and is_white(b)) or (is_black(a) and is_black(b))

def is_path_clear(b:Board, a:Tuple[int,int], d:Tuple[int,int]) -> bool:
    ar,ac = a; dr,dc = d
    step_r = 0 if dr==ar else (1 if dr>ar else -1)
    step_c = 0 if dc==ac else (1 if dc>ac else -1)
    r,c = ar + step_r, ac + step_c
    while (r,c) != (dr,dc):
        if b[r][c] != '.':
            return False
        r += step_r; c += step_c
    return True

def valid_pawn_move(b:Board, src, dst, p: str) -> bool:
    sr,sc = src; dr,dc = dst
    dir_ = -1 if is_white(p) else 1
    start_row = 6 if is_white(p) else 1
    tgt = piece_at(b, dst)
    # single forward
    if dc == sc and dr == sr + dir_ and tgt == '.':
        return True
    # double forward from start
    if dc == sc and sr == start_row and dr == sr + 2*dir_ and tgt == '.':
        mid = (sr + dir_, sc)
        if piece_at(b, mid) == '.':
            return True
    # capture
    if abs(dc - sc) == 1 and dr == sr + dir_ and tgt != '.':
        if is_white(p) and is_black(tgt): return True
        if is_black(p) and is_white(tgt): return True
    return False

def valid_knight_move(src, dst) -> bool:
    sr,sc = src; dr,dc = dst
    return (abs(sr-dr), abs(sc-dc)) in ((1,2),(2,1))

def valid_king_move(src,dst) -> bool:
    sr,sc = src; dr,dc = dst
    return max(abs(sr-dr), abs(sc-dc)) == 1

def valid_bishop_move(b,src,dst) -> bool:
    sr,sc = src; dr,dc = dst
    if abs(sr-dr) != abs(sc-dc): return False
    return is_path_clear(b, src, dst)

def valid_rook_move(b,src,dst) -> bool:
    sr,sc = src; dr,dc = dst
    if sr != dr and sc != dc: return False
    return is_path_clear(b, src, dst)

def valid_queen_move(b,src,dst) -> bool:
    return valid_bishop_move(b,src,dst) or valid_rook_move(b,src,dst)

def valid_move(b:Board, src, dst, white_turn: bool) -> bool:
    if not (in_bounds(*src) and in_bounds(*dst)): return False
    p = piece_at(b, src)
    if p == '.': return False
    if white_turn and not is_white(p): return False
    if not white_turn and not is_black(p): return False
    tgt = piece_at(b, dst)
    if is_same_side(p, tgt): return False
    up = p.upper()
    if up == 'P': return valid_pawn_move(b, src, dst, p)
    if up == 'N': return valid_knight_move(src,dst)
    if up == 'K': return valid_king_move(src,dst)
    if up == 'B': return valid_bishop_move(b,src,dst)
    if up == 'R': return valid_rook_move(b,src,dst)
    if up == 'Q': return valid_queen_move(b,src,dst)
    return False

def move_piece(b:Board, src, dst) -> None:
    sr,sc = src; dr,dc = dst
    p = b[sr][sc]
    b[dr][dc] = b[sr][sc]
    b[sr][sc] = '.'
    # pawn promotion
    if p.upper() == 'P':
        if is_white(p) and dr == 0: b[dr][dc] = 'Q'
        if is_black(p) and dr == 7: b[dr][dc] = 'q'

def king_exists(b:Board, white:bool) -> bool:
    target = 'K' if white else 'k'
    for r in range(8):
        for c in range(8):
            if b[r][c] == target: return True
    return False

def main():
    b = init_board()
    white_turn = True
    move_count = 0
    print('\nPlayful Chess (Python) — local 2-player console game')
    print('Moves like: e2 e4. Type help or resign.')
    try:
        while True:
            print_board(b)
            prompt = 'White' if white_turn else 'Black'
            raw = input(f"{prompt} to move. Enter move (or 'help'/'resign'): ")
            if not raw: break
            parts = raw.strip().split()
            if len(parts) == 0: continue
            if parts[0] == 'help':
                print("Enter moves like 'e2 e4'. Type 'resign' to give up.")
                continue
            if parts[0] == 'resign':
                print(f"{prompt} resigns. {( 'Black' if white_turn else 'White')} wins!")
                break
            if len(parts) < 2:
                print('Provide a source and destination like: e2 e4')
                continue
            src = parse_square(parts[0])
            dst = parse_square(parts[1])
            if not (in_bounds(*src) and in_bounds(*dst)):
                print('Invalid square. Use a-h and 1-8.')
                continue
            if not valid_move(b, src, dst, white_turn):
                print('Illegal move for that piece (or trying to capture your own piece).')
                continue
            captured = piece_at(b, dst)
            move_piece(b, src, dst)
            move_count += 1
            if captured != '.':
                print(f"Nice! {prompt} captured '{captured}'.")
            else:
                if move_count % 4 == 0:
                    print('Smooth move! Keep the pressure.')
            if not king_exists(b, True):
                print("Black captured White's king. Black wins!")
                break
            if not king_exists(b, False):
                print("White captured Black's king. White wins!")
                break
            white_turn = not white_turn
    except (EOFError, KeyboardInterrupt):
        print('\nExiting game.')

if __name__ == '__main__':
    main()
