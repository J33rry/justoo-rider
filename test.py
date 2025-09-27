import sys
input = sys.stdin.readline
MOD = 10**9 + 7

def HardQueries(N, Val, Q, Queries):
    B = int(N**0.5) + 1
    
    # Precompute for small Y
    pre_sum = {}
    pre_prod = {}
    for y in range(1, B+1):
        pre_sum[y] = [[] for _ in range(y)]
        pre_prod[y] = [[] for _ in range(y)]
        for r in range(y):
            s, p = 0, 1
            pre_sum[y][r].append(0)   # prefix base
            pre_prod[y][r].append(1)  # prefix base
            for i in range(r, N, y):
                s += Val[i]
                p = (p * Val[i]) % MOD
                pre_sum[y][r].append(s % MOD)
                pre_prod[y][r].append(p)

    ans = []
    for typ, X, Y in Queries:
        X -= 1  # convert to 0-based
        if Y <= B:
            r = X % Y
            idx = X // Y + 1
            if typ == 0:  # sum
                res = pre_sum[Y][r][-1] - pre_sum[Y][r][idx-1]
                ans.append(res % MOD)
            else:  # product
                res = 1
                arr = pre_prod[Y][r]
                res = arr[-1] * pow(arr[idx-1], -1, MOD) % MOD
                ans.append(res)
        else:
            if typ == 0:
                s = 0
                for i in range(X, N, Y):
                    s += Val[i]
                ans.append(s % MOD)
            else:
                p = 1
                for i in range(X, N, Y):
                    p = (p * Val[i]) % MOD
                ans.append(p)
    return ans


# Driver
T = int(input())
for _ in range(T):
    N = int(input())
    Val = list(map(int, input().split()))
    Q = int(input())
    Queries = [tuple(map(int, input().split())) for _ in range(Q)]
    result = HardQueries(N, Val, Q, Queries)
    print(" ".join(map(str, result)))