import type { ChatRequest, ChatResponse, Citation, Comparison } from '@/types/chat';
import { generateMessageId, getCurrentTimestamp } from '@/lib/chatUtils';

// =============================================================================
// CHAT SERVICE INTERFACE
// =============================================================================

export interface ChatService {
  sendMessage(request: ChatRequest): Promise<ChatResponse>;
}

// =============================================================================
// MOCK RESPONSE DATA
// =============================================================================

interface MockResponseTemplate {
  content: string;
  citation?: Citation;
  comparison?: Comparison;
}

const MOCK_RESPONSES: Record<string, MockResponseTemplate> = {
  homeOffice: {
    content: `Based on the client's Schedule C activity, they may qualify for the home office deduction under IRC §280A. The key requirements are:

1. Regular and exclusive use for business
2. Principal place of business OR place to meet clients

For most taxpayers, I recommend comparing both methods to determine which provides the greater benefit.`,
    citation: {
      source: 'IRC Section 280A(c)(1)',
      excerpt: 'A portion of the dwelling unit which is exclusively used on a regular basis as the principal place of business for any trade or business of the taxpayer...',
    },
    comparison: {
      options: [
        {
          title: 'Simplified Method',
          formula: 'Up to 300 sq ft × $5',
          result: 'Max $1,500',
          recommended: true,
        },
        {
          title: 'Regular Method',
          formula: 'Actual expenses × business %',
          result: 'Varies',
        },
      ],
    },
  },

  qbi: {
    content: `The Qualified Business Income (QBI) deduction under IRC §199A allows eligible taxpayers to deduct up to 20% of qualified business income from pass-through entities.

Key limitations to consider:
- W-2 wage limitation applies above income thresholds
- Specified service trades or businesses (SSTBs) have additional restrictions
- The deduction is limited to the greater of 50% of W-2 wages OR 25% of W-2 wages plus 2.5% of qualified property`,
    citation: {
      source: 'IRC Section 199A',
      excerpt: 'In the case of a taxpayer other than a corporation, there shall be allowed as a deduction for any taxable year an amount equal to the sum of the combined qualified business income amount...',
    },
  },

  depreciation: {
    content: `For business assets, you have several depreciation options under the tax code:

1. **Section 179 Expensing**: Immediate deduction up to $1,160,000 (2024)
2. **Bonus Depreciation**: 60% in 2024 (phasing down)
3. **MACRS**: Standard depreciation over asset life

The optimal choice depends on current year income, expected future income, and business cash flow needs.`,
    citation: {
      source: 'IRC Section 179 & 168(k)',
      excerpt: 'A taxpayer may elect to treat the cost of any section 179 property as an expense which is not chargeable to capital account...',
    },
    comparison: {
      options: [
        {
          title: 'Section 179',
          formula: '100% Year 1',
          result: 'Full deduction',
          recommended: true,
        },
        {
          title: 'MACRS 5-Year',
          formula: '20%, 32%, 19.2%...',
          result: 'Spread over time',
        },
      ],
    },
  },

  vehicle: {
    content: `For business vehicle deductions, taxpayers can choose between two methods:

1. **Standard Mileage Rate**: 67 cents per mile for 2024
2. **Actual Expense Method**: Deduct actual costs (gas, insurance, repairs, depreciation) × business use percentage

The standard mileage rate is simpler, but actual expenses may provide a larger deduction for expensive vehicles or high operating costs.`,
    citation: {
      source: 'IRS Rev. Proc. 2023-34',
      excerpt: 'The standard mileage rate for transportation expenses paid or incurred is 67 cents per mile for all miles of business use...',
    },
  },

  dependents: {
    content: `For tax year 2024, dependent-related tax benefits include:

- **Child Tax Credit**: Up to $2,000 per qualifying child under 17
- **Credit for Other Dependents**: $500 for qualifying relatives
- **Child and Dependent Care Credit**: Up to $3,000 (1 qualifying individual) or $6,000 (2+)
- **Earned Income Tax Credit**: Enhanced amounts for qualifying children

I recommend reviewing the client's filing status and household composition to optimize these credits.`,
    citation: {
      source: 'IRC Sections 24 & 32',
      excerpt: 'There shall be allowed as a credit against the tax imposed by this chapter for the taxable year with respect to each qualifying child of the taxpayer...',
    },
  },

  income: {
    content: `Based on the client's income sources, here's an overview of the tax treatment:

- **W-2 Income**: Subject to income tax and FICA (already withheld)
- **1099-NEC**: Subject to income tax plus self-employment tax (15.3%)
- **Schedule C**: Net profit subject to SE tax after business deductions
- **K-1 Income**: Treatment depends on entity type and material participation

The key is to maximize above-the-line deductions and credits to reduce overall tax liability.`,
  },

  deduction: {
    content: `Common deductions to consider for this client:

**Above-the-Line Deductions:**
- Self-employed health insurance
- Self-employment tax deduction (50%)
- Retirement contributions (SEP, SIMPLE, Solo 401k)
- Student loan interest

**Itemized vs. Standard:**
The 2024 standard deduction is $14,600 (single) or $29,200 (MFJ). Compare with potential itemized deductions (mortgage interest, state taxes up to $10k SALT cap, charitable contributions).`,
  },

  retirement: {
    content: `For self-employed clients, retirement contribution options include:

1. **SEP-IRA**: Up to 25% of net SE income (max $69,000 for 2024)
2. **Solo 401(k)**: Employee + employer contributions up to $69,000
3. **SIMPLE IRA**: Up to $16,000 employee + 3% employer match

Solo 401(k) typically offers the highest contribution limits and flexibility. The deadline for establishing a SEP or Solo 401(k) is the tax return due date (including extensions).`,
    comparison: {
      options: [
        {
          title: 'Solo 401(k)',
          formula: '$23,000 + 25% profits',
          result: 'Max $69,000',
          recommended: true,
        },
        {
          title: 'SEP-IRA',
          formula: '25% of net SE income',
          result: 'Max $69,000',
        },
      ],
    },
  },

  default: {
    content: `I can help you research tax questions for this client. Here are some areas I can assist with:

- Deduction analysis and optimization
- Credit eligibility review
- Business expense categorization
- Retirement contribution strategies
- Entity structure considerations
- State tax implications

What specific aspect would you like me to research?`,
  },
};

// =============================================================================
// KEYWORD MATCHING
// =============================================================================

function selectMockResponse(message: string): MockResponseTemplate {
  const lower = message.toLowerCase();

  if (lower.includes('home office') || lower.includes('home-office') || lower.includes('280a')) {
    return MOCK_RESPONSES.homeOffice;
  }

  if (lower.includes('qbi') || lower.includes('199a') || lower.includes('qualified business income')) {
    return MOCK_RESPONSES.qbi;
  }

  if (lower.includes('depreciat') || lower.includes('179') || lower.includes('macrs') || lower.includes('bonus')) {
    return MOCK_RESPONSES.depreciation;
  }

  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('mileage') || lower.includes('auto')) {
    return MOCK_RESPONSES.vehicle;
  }

  if (lower.includes('dependent') || lower.includes('child') || lower.includes('ctc') || lower.includes('eitc')) {
    return MOCK_RESPONSES.dependents;
  }

  if (lower.includes('income') || lower.includes('w-2') || lower.includes('w2') || lower.includes('1099') || lower.includes('k-1')) {
    return MOCK_RESPONSES.income;
  }

  if (lower.includes('deduct') || lower.includes('itemiz') || lower.includes('standard')) {
    return MOCK_RESPONSES.deduction;
  }

  if (lower.includes('retire') || lower.includes('401k') || lower.includes('sep') || lower.includes('ira') || lower.includes('pension')) {
    return MOCK_RESPONSES.retirement;
  }

  return MOCK_RESPONSES.default;
}

// =============================================================================
// MOCK CHAT SERVICE
// =============================================================================

const MOCK_DELAY_MS = 1500;

class MockChatService implements ChatService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

    // Select response based on message content
    const template = selectMockResponse(request.message);

    return {
      id: generateMessageId(),
      content: template.content,
      timestamp: getCurrentTimestamp(),
      citation: template.citation,
      comparison: template.comparison,
    };
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

// To switch to real API later, change this to:
// export const chatService: ChatService = new RealChatService({ baseUrl: process.env.NEXT_PUBLIC_API_URL });
export const chatService: ChatService = new MockChatService();
