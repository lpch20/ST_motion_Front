export class DebtData {
    idCustomer: number = 0;
    idPay: string = "";
    ci: string = "";
    atrazo: number = 0;
    totalDebt: number = 0;
    totalFeesDelayAmnesty: number = 0;
    totalFeesAmnesty: number = 0;
    maxToCharge: number = 0;
    minimumToCharge: number = 0;
    haveCreditCard: boolean = false;
    havePurchaseOrder: boolean = false;
    haveAmnesty: boolean = false;
    amountOrderDollar: number = 0;
    amountOrderPesos: number = 0;
    amountCreditCardDollar: number = 0;
    amountCreditCardPesos: number = 0;
    delayCreditCard: number = 0;
    delayOrder: number = 0;
    delayAmnesty: number = 0;
    amountAmnestyPesos: number = 0;
    amountAmnestyDollar: number = 0;
    portfolio: string = "";
}