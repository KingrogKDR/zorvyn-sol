class TokenBucket {
    constructor(capacity, refillRate) {
        this.capacity = capacity;       // max tokens
        this.tokens = capacity;         // current tokens
        this.refillRate = refillRate;   // tokens per second
        this.lastRefill = Date.now();
    }

    refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;

        const refillTokens = elapsed * this.refillRate;

        this.tokens = Math.min(
            this.capacity,
            this.tokens + refillTokens
        );

        this.lastRefill = now;
    }

    allowRequest() {
        this.refill();

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }

        return false;
    }
}

const userBuckets = new Map();

function getUserBucket(userId) {
    if (!userBuckets.has(userId)) {
        userBuckets.set(
            userId,
            new TokenBucket(10, 5)
        );
    }

    return userBuckets.get(userId);
}

export { getUserBucket, TokenBucket };

