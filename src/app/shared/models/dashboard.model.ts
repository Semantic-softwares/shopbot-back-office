export interface Dashboard {
    totalProfit: {
        amount: number;
        sum: number;
    };
    storeSales: {
        amount: number;
        sum: number;
    };
    onlineSales: {
        amount: number;
        sum: number;
    };
    totalRevenue: {
        amount: number;
        sum: number;
    };
    completedOrders: {
        amount: number;
        sum: number;
    };
    canceledOrders: {
        amount: number;
        sum: number;
    };
    paymentSummary: {
        payment: string | null;
        amount: number;
        sum: number;
    }[];
    staffOrders: {
        staffOrdersCount: number;
        staffOrdersTotal: number;
        staffId: string;
        staffName: string;
    }[];
    orderTypeSummary: {
        totalOrders: number;
        totalAmount: number;
        type: string;
    }[];
    ordersByYearMonth: {
        _id: {
            year: number;
            month: number;
        };
        totalOrders: number;
        totalAmount: number;
        year: number;
        month: number;
    }[];
    totalOrders: number;
    totalOrderAmount: number;
    _id: string;
    totalReviews: number;
    averageRating: number;
    totalProducts: number;
    reviews: {
        _id: string;
        user: {
            _id: string;
            name: string;
        };
        anonymous: boolean | null;
        rating: number;
        store: {
            _id: string;
            name: string;
        };
        review: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
    }[];
}