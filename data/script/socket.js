if (data.reload !== true && data.bookingId) {
  var refId = 1;
  if (data.refId) {
    refId = data.refId;
  }
  var loadOptionsBill = {
    filter:
      '[["booking_id", "=", ' +
      data.bookingId +
      '],"and",["isDeleted","=",false]]',
  };
  var _dynamicEntityManager = abp.services.app.dynamicEntity;

  _dynamicEntityManager
    .getResourcesByKeyFilter("hotelpms_bill", loadOptionsBill)
    .done(function (billresult) {
      var loadOptions = {
        filter: '["booking_id", "=", ' + data.bookingId + "]",
      };
      _dynamicEntityManager
        .getResourcesByKeyFilter("hotelpms_billPay", loadOptions)
        .done(function (billPayResult) {
          _dynamicEntityManager
            .getResourcesByKey("hotelpms_currency")
            .done(function (currencyResult) {
              var baseCurrency = "MNT";
              var currencies = $.map(currencyResult, function (curr) {
                var currency = JSON.parse(curr.document);
                if (currency.isBase === true) {
                  baseCurrency = currency.code;
                }
                return currency;
              });
              var baseCurr = $.grep(currencies, function (cItem) {
                return cItem.isBase === true;
              })[0];
              if (baseCurr === undefined) {
                baseCurr = currencies[0];
              }
              var deposit = 0,
                amount = 0,
                roomCharge = 0,
                extraCharge = 0,
                extraCharges = [],
                bills = [],
                balanceString;
              data.reload = true;
              //Build bill pays
              data.billPays = $.map(billPayResult.items, function (billPay) {
                var billPayData = JSON.parse(billPay.document);
                var isDeleted = false;
                if (billPayData.isDeleted) {
                  isDeleted =
                    billPayData.isDeleted === "true" ||
                    billPayData.isDeleted === true
                      ? true
                      : false;
                }
                billPayData.id = billPay.id;
                var isRelated = true;
                if (
                  billPayData.refId &&
                  refId &&
                  refId < 100 &&
                  billPayData.refId < 100
                ) {
                  if (refId !== billPayData.refId) {
                    isRelated = false;
                  }
                }
                if (isRelated === true && isDeleted === false) {
                  billPayData.creationTime = abp.timing
                    .convertToUserTimezone(billPay.creationTime)
                    .format("YYYY-MM-DD hh:mm");
                  if (billPayData.currency) {
                    if (
                      !billPayData.amountCalculated ||
                      parseInt(billPayData.amountCalculated) === 0
                    ) {
                      billPayData.amountCalculated = Math.imul(
                        billPayData.paidAmount,
                        billPayData.currency.data.rate
                      );
                    }
                  } else {
                    billPayData.currency = baseCurr;
                    if (
                      !billPayData.amountCalculated ||
                      parseInt(billPayData.amountCalculated) === 0
                    ) {
                      billPayData.amountCalculated = Math.imul(
                        billPayData.paidAmount,
                        1
                      );
                    }
                  }
                  deposit = deposit + parseFloat(billPayData.amountCalculated);
                  return billPayData;
                } else {
                  return null;
                }
              });
              // Build bills
              data.bills = $.map(billresult.items, function (bill) {
                var billData = JSON.parse(bill.document);
                billData.id = bill.id;
                var isRelated = true;
                if (refId && refId < 100 && billData.refId < 100) {
                  if (refId !== billData.refId) {
                    isRelated = false;
                  }
                }
                if (isRelated === true) {
                  billData.creationTime = abp.timing
                    .convertToUserTimezone(bill.creationTime)
                    .format("YYYY-MM-DD hh:mm");
                  if (!billData.chargeDate && billData.itemGroup === "Room") {
                    billData.chargeDate = billData.quantity
                      .split("-")
                      .reverse()
                      .join("-");
                  }
                  if (billData.totalAmount) {
                    var calculatedTotal = 0;
                    if (baseCurrency === billData.currency) {
                      calculatedTotal = billData.totalAmount;
                    } else {
                      var rate = findRate(billData.currency, currencies);
                      calculatedTotal = Math.imul(billData.totalAmount, rate);
                    }
                    calculatedTotal = parseFloat(calculatedTotal);
                    amount = amount + calculatedTotal; // TODO Convert currency rate here
                    if (billData.type == "extraCharge") {
                      var qty = billData.quantity;
                      if (billData.unit) {
                        qty = qty + " " + billData.unit;
                      }
                      billData.quantity = qty;
                      extraCharge = extraCharge + calculatedTotal;
                      extraCharges.push(billData);
                    } else {
                      roomCharge = roomCharge + calculatedTotal;
                    }
                  }
                  return billData;
                } else {
                  return null;
                }
              });

              var balance = parseFloat(amount) - parseFloat(deposit);

              if (balance < 0) {
                balanceString =
                  '<strong class="text-danger">' +
                  balance.toLocaleString() +
                  "</strong>";
              } else {
                balanceString =
                  '<strong class="text-success"> +' +
                  balance.toLocaleString() +
                  "</strong>";
              }
              if (balance === 0) {
                balanceString =
                  '<strong class="text-success"> ' +
                  balance.toLocaleString() +
                  "</strong>";
              }

              data.extraCharge = extraCharge.toLocaleString();
              data.extraCharges = extraCharges;
              data.balance = balanceString;
              data.balanceCharge = balance.toLocaleString();
              data.roomCharge = roomCharge.toLocaleString();
              data.deposit = deposit.toLocaleString();
              data.amount = amount.toLocaleString();
              data.totalAmount = amount.toLocaleString();
              data.totalPaid = deposit;
              data.baseCurrency = baseCurrency;
              instance.triggerChange();
            });
        });
    });
}

function findRate(rateCode, currencies) {
  var index = 0,
    found,
    entry;
  for (index = 0; index < currencies.length; ++index) {
    entry = currencies[index];
    if (entry.code == rateCode) {
      found = entry;
      break;
    }
  }
  return found.rate;
}
