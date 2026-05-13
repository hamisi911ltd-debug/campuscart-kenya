// Local Lucky Codes System for Development
// This provides a fallback when Cloudflare D1 database is not available

interface LuckyCode {
  id: string;
  code: string;
  points: number;
  description: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

interface UserRedemption {
  userId: string;
  codeId: string;
  redeemedAt: string;
}

const DEFAULT_LUCKY_CODES: LuckyCode[] = [
  {
    id: '1',
    code: 'WELCOME500',
    points: 500,
    description: 'Welcome bonus - Get 500 points (KES 50) in your wallet!',
    usageLimit: 1000,
    usedCount: 0,
    isActive: true
  },
  {
    id: '2',
    code: 'STUDENT100',
    points: 100,
    description: 'Student discount - Get 100 points (KES 10) in your wallet!',
    usageLimit: 1000,
    usedCount: 0,
    isActive: true
  },
  {
    id: '3',
    code: 'LUCKY250',
    points: 250,
    description: 'Lucky draw winner - Get 250 points (KES 25) in your wallet!',
    usageLimit: 1000,
    usedCount: 0,
    isActive: true
  },
  {
    id: '4',
    code: 'CAMPUS200',
    points: 200,
    description: 'Campus special - Get 200 points (KES 20) in your wallet!',
    usageLimit: 1000,
    usedCount: 0,
    isActive: true
  },
  {
    id: '5',
    code: 'FLASH300',
    points: 300,
    description: 'Flash sale bonus - Get 300 points (KES 30) in your wallet!',
    usageLimit: 1000,
    usedCount: 0,
    isActive: true
  }
];

class LocalLuckyCodesService {
  private getStorageKey(key: string): string {
    return `campusmart_${key}`;
  }

  private getLuckyCodes(): LuckyCode[] {
    const stored = localStorage.getItem(this.getStorageKey('lucky_codes'));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // If parsing fails, return defaults
      }
    }
    
    // Initialize with default codes
    this.saveLuckyCodes(DEFAULT_LUCKY_CODES);
    return DEFAULT_LUCKY_CODES;
  }

  private saveLuckyCodes(codes: LuckyCode[]): void {
    localStorage.setItem(this.getStorageKey('lucky_codes'), JSON.stringify(codes));
  }

  private getRedemptions(): UserRedemption[] {
    const stored = localStorage.getItem(this.getStorageKey('redemptions'));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveRedemptions(redemptions: UserRedemption[]): void {
    localStorage.setItem(this.getStorageKey('redemptions'), JSON.stringify(redemptions));
  }

  private getUserWalletBalance(userId: string): number {
    // Try to get from localStorage as backup, but prefer the value passed from the store
    const stored = localStorage.getItem(this.getStorageKey(`wallet_${userId}`));
    return stored ? parseFloat(stored) : 0;
  }

  private setUserWalletBalance(userId: string, balance: number): void {
    // Store in localStorage as backup
    localStorage.setItem(this.getStorageKey(`wallet_${userId}`), balance.toString());
  }

  async redeemCode(code: string, userId: string, currentWalletBalance?: number): Promise<{
    success: boolean;
    error?: string;
    points?: number;
    newBalance?: number;
    message?: string;
  }> {
    try {
      const codes = this.getLuckyCodes();
      const redemptions = this.getRedemptions();

      // Find the code
      const luckyCode = codes.find(c => 
        c.code.toUpperCase() === code.toUpperCase() && c.isActive
      );

      if (!luckyCode) {
        return {
          success: false,
          error: 'Invalid lucky code'
        };
      }

      // Check if user already redeemed this code
      const existingRedemption = redemptions.find(r => 
        r.userId === userId && r.codeId === luckyCode.id
      );

      if (existingRedemption) {
        return {
          success: false,
          error: 'You have already redeemed this lucky code'
        };
      }

      // Check usage limit
      if (luckyCode.usageLimit && luckyCode.usedCount >= luckyCode.usageLimit) {
        return {
          success: false,
          error: 'This lucky code has reached its usage limit'
        };
      }

      // Update code usage count
      luckyCode.usedCount += 1;
      this.saveLuckyCodes(codes);

      // Add redemption record
      const newRedemption: UserRedemption = {
        userId,
        codeId: luckyCode.id,
        redeemedAt: new Date().toISOString()
      };
      redemptions.push(newRedemption);
      this.saveRedemptions(redemptions);

      // Calculate new balance - use provided current balance or stored balance
      const currentBalance = currentWalletBalance !== undefined 
        ? currentWalletBalance 
        : this.getUserWalletBalance(userId);
      const newBalance = currentBalance + luckyCode.points;
      
      // Update local storage wallet (as backup)
      this.setUserWalletBalance(userId, newBalance);

      return {
        success: true,
        points: luckyCode.points,
        newBalance,
        message: `You earned ${luckyCode.points} points (KES ${(luckyCode.points / 10).toFixed(2)}) in your wallet!`
      };

    } catch (error) {
      console.error('Local lucky code redemption error:', error);
      return {
        success: false,
        error: 'Failed to redeem lucky code'
      };
    }
  }

  async getAvailableCodes(): Promise<LuckyCode[]> {
    return this.getLuckyCodes().filter(code => code.isActive);
  }

  getUserWallet(userId: string): { balance: number } {
    return {
      balance: this.getUserWalletBalance(userId)
    };
  }

  // Reset all data (for testing)
  reset(): void {
    localStorage.removeItem(this.getStorageKey('lucky_codes'));
    localStorage.removeItem(this.getStorageKey('redemptions'));
    // Don't reset wallet balances as they might be used elsewhere
  }
}

export const localLuckyCodesService = new LocalLuckyCodesService();