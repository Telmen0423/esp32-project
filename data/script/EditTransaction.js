var _resourceManager = abp.services.app.dynamicEntity;
var _taskStartModal = app.StartTaskModal();
var _manageResourceModal = app.ManageResourceModal();
var _reportManager = abp.services.app.report;
var booking = null;

function getHotelConfig() {
  var config = $.Deferred();
  _resourceManager
    .getResourcesByKey("hotelpms_config")
    .done(function (configResult) {
      if (configResult) {
        if (configResult.length > 0) {
          var configParsed = JSON.parse(configResult[0].document);
          configParsed.id = configResult[0].id;
          var jString = JSON.stringify(configParsed);
          config.resolve(jString);
          localStorage.setItem("hotelpms_config", jString);
        } else {
          abp.message.error(
            "hotelpms_config нөөц дээр Тохиргооны мэдээлэл оруулна уу"
          );
        }
      } else {
        abp.message.error(
          "hotelpms_config нөөц дээр Тохиргооны мэдээлэл оруулна уу"
        );
      }
    });
  return config.promise();
}

$(document).ready(function () {
  console.log("document ready");
  getHotelConfig().done(function (result) {
    console.log(result);
  });

  data.rcInited = true;
  roomCharges.init();
  data.folioInited = true;
  folios.init();
  fnLoadBookedRoomData().done(function () {
    form.triggerChange();
  });
});

form.on("change", function (event) {
  console.log("form on change:");
  console.log("data", data);
  var triggerChange = false;

  if (data.rcInited !== true) {
    data.rcInited = true;
    triggerChange = true;
    roomCharges.$table.etDataGrid("instance").refresh();
  }

  if (data.folioInited !== true) {
    data.folioInited = true;
    triggerChange = true;
    folios.$table.etDataGrid("instance").refresh();
  }

  fnLoadBookedRoomData().done(function (result) {
    if (result.triggerChange === true || triggerChange === true) {
      form.triggerChange();
    }
  });

  if (booking === null) {
    _resourceManager.getResourceById(data.bookingId).done(function (result) {
      booking = JSON.parse(result.document);
      data.guestName = "Baldan";
      var guestLink = $("<a />", {
        text: booking.guest.data.fullName,
        href: "#",
        guestId: booking.guest_id,
        id: "guestHref",
      });
      $("#guestInfoDetail").append(guestLink);
      $("#table1").append(guestLink);

      guestLink.on("click", function (e) {
        _manageResourceModal.open({
          id: $(this).attr("guestId"),
        });
      });
    });
  }
});

var roomCharges = {
  $table: $("#roomChargeTable"),
  dataSource: null,
  column: [],
  dataTable: null,
  init: function () {
    roomCharges.column = [];
    roomCharges.initDataGrid();
  },
  initDataGrid: function () {
    var customStore = new BizPro.data.CustomStore({
      key: "id",
      load: function (loadOptions) {
        var bookingId = 0,
          refId = 1;
        if (data.bookingId) {
          bookingId = data.bookingId;
        }
        if (data.refId) {
          refId = data.refId;
        }
        var deferred = $.Deferred();
        //var params = {};
        //["filter", "group", "groupSummary", "parentIds", "requireGroupCount", "requireTotalCount", "searchExpr",
        //  "searchOperation", "searchValue", "select", "sort", "skip", "take", "totalSummary", "userData"
        //].forEach(function (i) {
        //  if (i in loadOptions && isNotEmpty(loadOptions[i])) { params[i] = JSON.stringify(loadOptions[i]); }
        //});
        var params = {
          filter:
            '[[ "booking_id","=","' +
            bookingId +
            '" ],"and",["refId","=","' +
            refId +
            '"],"and",["itemGroup","=","Room"],"and",["isDeleted","=",false]]',
          sort: '[{ "selector": "chargeDate", "desc": false }]',
        };
        _resourceManager
          .getResourcesByKeyFilter("hotelpms_bill", params)
          .done(function (result) {
            var bills = [];
            $.each(result.items, function (index, value) {
              var document = jQuery.parseJSON(value.document);
              document.id = value.id;
              document.creationTime = value.creationTime;
              if (document.adult && document.child) {
                document.pax =
                  document.adult.toString() + "/" + document.child.toString();
              } else {
                document.pax = data.pax;
              }
              if (document.chargeDate) {
                document.date = document.chargeDate;
              } else {
                document.date = document.quantity
                  .split("-")
                  .reverse()
                  .join("-");
              }
              document.tax =
                parseFloat(document.totalAmount) - parseFloat(document.amount);
              document.typeId = 1;
              bills.push(document);
            });
            bills.sort(compareDate);
            deferred.resolve(bills, { totalCount: bills.length });
          });
        return deferred.promise();
      },
    });
    roomCharges.dataSource = new BizPro.data.DataSource({ store: customStore });
    roomCharges.column.push({
      caption: app.localize("StayDate"),
      dataField: "quantity",
    });
    roomCharges.column.push({
      caption: app.localize("Room"),
      dataField: "itemName",
    });
    roomCharges.column.push({
      width: 50,
      caption: app.localize("Pax"),
      dataField: "pax",
    });
    roomCharges.column.push({
      width: 90,
      caption: app.localize("Charge"),
      dataField: "amount",
    });
    roomCharges.column.push({
      width: 90,
      caption: app.localize("Tax"),
      dataField: "tax",
    });
    roomCharges.column.push({
      width: 90,
      caption: app.localize("TotalAmount"),
      dataField: "totalAmount",
    });
    roomCharges.column.push({
      caption: app.localize("User"),
      dataField: "creatorUser",
    });
    roomCharges.column.push({
      caption: app.localize("Action"),
      cellTemplate: function (element, info) {
        var buttonDropDown = $("<button>", {
          type: "button",
          class: "btn btn-outline-primary dropdown-toggle",
          "data-toggle": "dropdown",
          "aria-haspopup": "true",
          "aria-expanded": "false",
        });
        var iitem = $("<i>", { class: "fas fa-cog" });
        buttonDropDown.append(iitem).append("Action");
        var btnContainer = $("<div>", { class: "dropdown-menu pull-right" });
        var btn1 = $("<div>", { class: "dropdown-item" }).append(
          $("<a>", {
            class: "buttonEditRateType",
            value: info.data.id,
            id: "buttonEditRateType",
            href: "#",
            text: app.localize("EditRateType"),
          })
        );
        var btn2 = $("<div>", { class: "dropdown-item" }).append(
          $("<a>", {
            class: "buttonEditPax",
            value: info.data.id,
            id: "buttonEditPax",
            href: "#",
            text: app.localize("EditPax"),
          })
        );
        var btn3 = $("<div>", { class: "dropdown-item" }).append(
          $("<a>", {
            class: "buttonEditRate",
            value: info.data.id,
            id: "buttonEditRate",
            href: "#",
            text: app.localize("EditRate"),
          })
        );

        btnContainer.append(btn1).append(btn2).append(btn3);

        element.append(buttonDropDown).append(btnContainer);
      },
    });
    roomCharges.dataTable = roomCharges.$table.etDataGrid({
      dataSource: roomCharges.dataSource,
      paging: {
        pageSize: 25,
      },
      pager: {
        showPageSizeSelector: true,
        showInfo: true,
        allowedPageSizes: [25, 50, 100, 500],
      },
      onCellPrepared(options) {},
      searchPanel: {
        visible: false,
        highlightCaseSensitive: true,
      },
      groupPanel: {
        visible: false,
      },
      grouping: {
        autoExpandAll: true,
      },
      allowColumnReordering: true,
      rowAlternationEnabled: true,
      wordWrapEnabled: true,
      hoverStateEnabled: true,
      showBorders: true,
      cellHintEnabled: true,
      columnFixing: {
        enabled: true,
      },
      columns: roomCharges.column,
      onRowDblClick: function (e) {
        var id = e.data.id;
      },
    });
  },
};

var folios = {
  $table: $("#folioTable"),
  dataSource: null,
  column: [],
  dataTable: null,
  init: function () {
    console.log("loading folios");
    folios.column = [];
    folios.initDataGrid();
  },
  initDataGrid: function () {
    var folioCustomStore = new BizPro.data.CustomStore({
      key: "id",
      load: function (loadOptions) {
        var deferred = $.Deferred();
        var bookingId = 0,
          refId = 1;
        if (data.bookingId) {
          bookingId = data.bookingId;
        }
        if (data.refId) {
          refId = data.refId;
        }
        var queryFilterBill = {
          glue: "and",
          rules: [
            {
              field: "hotelpms_bill.booking_id",
              type: "number",
              condition: {
                filter: bookingId,
                type: "equal",
              },
              includes: [],
            },
            {
              field: "hotelpms_bill.refId",
              type: "number",
              condition: {
                filter: refId,
                type: "equal",
              },
              includes: [],
            },
            {
              field: "hotelpms_bookedRooms.refId",
              type: "number",
              condition: {
                filter: refId,
                type: "equal",
              },
              includes: [],
            },
            {
              field: "hotelpms_bill.isDeleted",
              type: "text",
              condition: {
                filter: "false",
                type: "equal",
              },
              includes: [],
            },
          ],
        };
        var queryFilterBillPay = {
          glue: "and",
          rules: [
            {
              field: "hotelpms_billPay.booking_id",
              type: "number",
              condition: {
                filter: bookingId,
                type: "equal",
              },
              includes: [],
            },
            {
              field: "hotelpms_billPay.refId",
              type: "number",
              condition: {
                filter: refId,
                type: "equal",
              },
              includes: [],
            },
            {
              field: "hotelpms_bookedRooms.refId",
              type: "number",
              condition: {
                filter: refId,
                type: "equal",
              },
              includes: [],
            },
            {
              field: "hotelpms_billPay.isDeleted",
              type: "text",
              condition: {
                filter: "false",
                type: "equal",
              },
              includes: [],
            },
          ],
        };
        var billFilter = {
          data: "hotelpms_bill",
          group: "",
          joins: [
            '{ id: "hotelpms_bill/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_bill", tid: "hotelpms_booking" }',
            '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }',
          ],
          query: JSON.stringify(queryFilterBill),
          sort: null,
        };
        var billPayFilter = {
          data: "hotelpms_billPay",
          group: "",
          joins: [
            '{ id: "hotelpms_billPay/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_billPay", tid: "hotelpms_booking" }',
            '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }',
          ],
          query: JSON.stringify(queryFilterBillPay),
          sort: null,
        };
        _reportManager.getReportData(billFilter).done(function (billResult) {
          _reportManager
            .getReportData(billPayFilter)
            .done(function (billPayResult) {
              _resourceManager
                .getResourcesByKey("hotelpms_currency")
                .done(function (currencyResult) {
                  var bills = [],
                    billPays = [],
                    flist = [],
                    totalRC = 0,
                    totalEC = 0,
                    totalCharge = 0,
                    totalPaid = 0;
                  var baseCurrency = "",
                    baseCurr = {};
                  var currencies = $.map(currencyResult, function (curr) {
                    var currency = JSON.parse(curr.document);
                    if (currency.isBase === true) {
                      baseCurrency = currency.code;
                      baseCurr = currency;
                    }
                    return currency;
                  });
                  $.each(billResult, function (index, billValue) {
                    var billDoc = JSON.parse(billValue.document);
                    var existInd = bills.findIndex(
                      (x) => x.id === billValue.id
                    );
                    if (existInd === -1) {
                      var billItem = {
                          id: billValue.id,
                          typeId: 1,
                        },
                        roomName = "";
                      if (
                        billDoc.hotelpms_bookedRooms.room &&
                        billDoc.hotelpms_bookedRooms.room.data
                      ) {
                        roomName =
                          billDoc.hotelpms_bookedRooms.room.data.name +
                          "/" +
                          billDoc.hotelpms_bookedRooms.roomType.data.shortName;
                      } else {
                        roomName =
                          billDoc.hotelpms_bookedRooms.roomType.data.shortName;
                      }
                      if (billDoc.hotelpms_bill.type === "extraCharge") {
                        if (billDoc.hotelpms_bill.chargeDate) {
                          billItem.date = billDoc.hotelpms_bill.chargeDate;
                        } else if (billDoc.hotelpms_bill.postedDate) {
                          billItem.date = abp.timing
                            .convertToUserTimezone(
                              billDoc.hotelpms_bill.postedDate
                            )
                            .startOf("day")
                            .format("YYYY-MM-DD")
                            .toString();
                        } else {
                          billItem.date = abp.timing
                            .convertToUserTimezone(billValue.creationTime)
                            .format("YYYY-MM-DD");
                        }
                        billItem.itemName = billDoc.hotelpms_bill.itemName;
                        billItem.typeId1 = 2;
                      } else {
                        if (billDoc.hotelpms_bill.chargeDate) {
                          billItem.date = billDoc.hotelpms_bill.chargeDate;
                        } else {
                          billItem.date = billDoc.hotelpms_bill.quantity
                            .split("-")
                            .reverse()
                            .join("-");
                        }
                        billItem.itemName = app.localize("RoomCharge");
                        billItem.typeId1 = 1;
                      }
                      billItem.roomName = roomName;
                      billItem.totalAmount = billDoc.hotelpms_bill.totalAmount;
                      billItem.currency = billDoc.hotelpms_bill.currency;
                      if (!billDoc.hotelpms_bill.calculatedTotal) {
                        var calculatedTotal = 0;
                        if (baseCurrency === billDoc.hotelpms_bill.currency) {
                          calculatedTotal = billDoc.hotelpms_bill.totalAmount;
                        } else {
                          var rate = findRate(
                            billDoc.hotelpms_bill.currency,
                            currencies
                          );
                          calculatedTotal = Math.imul(
                            billDoc.hotelpms_bill.totalAmount,
                            rate
                          );
                        }
                        billDoc.hotelpms_bill.calculatedTotal = calculatedTotal;
                      }
                      if (billItem.typeId1 === 1) {
                        totalRC += parseFloat(
                          billDoc.hotelpms_bill.calculatedTotal
                        );
                      } else {
                        totalEC += parseFloat(
                          billDoc.hotelpms_bill.calculatedTotal
                        );
                      }
                      totalCharge += parseFloat(
                        billDoc.hotelpms_bill.calculatedTotal
                      );
                      billItem.calculatedTotal =
                        billDoc.hotelpms_bill.calculatedTotal.toLocaleString() +
                        billDoc.hotelpms_bill.currency;
                      var billComment = "";
                      if (baseCurrency !== billDoc.hotelpms_bill.currency) {
                        billComment =
                          "[" +
                          billDoc.hotelpms_bill.currency +
                          ":" +
                          billDoc.hotelpms_bill.totalAmount +
                          "]";
                      }
                      billItem.comment = billComment;
                      if (billDoc.hotelpms_bill.postedUser) {
                        billItem.user = billDoc.hotelpms_bill.postedUser;
                      } else {
                        billItem.user = "";
                      }
                      bills.push(billItem);
                    }
                  });
                  $.each(billPayResult, function (payIndex, billPayValue) {
                    var billPayDoc = JSON.parse(billPayValue.document);
                    var existInd = billPays.findIndex(
                      (x) => x.id === billPayValue.id
                    );
                    if (existInd === -1) {
                      var billPayItem = {
                          id: billPayValue.id,
                          typeId: 2,
                        },
                        roomName = "";
                      if (
                        billPayDoc.hotelpms_bookedRooms.room &&
                        billPayDoc.hotelpms_bookedRooms.room.data
                      ) {
                        roomName =
                          billPayDoc.hotelpms_bookedRooms.room.data.name +
                          "/" +
                          billPayDoc.hotelpms_bookedRooms.roomType.data
                            .shortName;
                      } else {
                        roomName =
                          billPayDoc.hotelpms_bookedRooms.roomType.data
                            .shortName;
                      }
                      if (billPayDoc.hotelpms_billPay.paidDate) {
                        billPayItem.date = billPayDoc.hotelpms_billPay.paidDate;
                      } else {
                        billPayItem.date = billPayValue.creationTime
                          .format("YYYY-MM-DD")
                          .toString();
                      }
                      billPayItem.itemName =
                        billPayDoc.hotelpms_billPay.paymentType +
                        "/" +
                        billPayDoc.hotelpms_billPay.paymentMethod.data.name;
                      billPayItem.roomName = roomName;
                      if (!billPayDoc.hotelpms_billPay.amountCalculated) {
                        billPayDoc.hotelpms_billPay.amountCalculated =
                          parseFloat(billPayDoc.hotelpms_billPay.paidAmount) *
                          parseFloat(
                            billPayDoc.hotelpms_billPay.currency.data
                              ? billPayDoc.hotelpms_billPay.currency.data.rate
                              : 1
                          );
                      }
                      totalPaid += parseFloat(
                        billPayDoc.hotelpms_billPay.amountCalculated
                      );
                      billPayItem.calculatedTotal =
                        billPayDoc.hotelpms_billPay.amountCalculated.toLocaleString() +
                        billPayDoc.hotelpms_billPay.currency.data.code;
                      var payComment = billPayDoc.hotelpms_billPay.comment;
                      if (
                        billPayDoc.hotelpms_billPay.currency &&
                        billPayDoc.hotelpms_billPay.currency.data
                      ) {
                        if (
                          billPayDoc.hotelpms_billPay.currency.data.isBase !==
                          true
                        ) {
                          payComment +=
                            " [" +
                            billPayDoc.hotelpms_billPay.currency.data.code +
                            ":" +
                            billPayDoc.hotelpms_billPay.paidAmount.toString() +
                            "]";
                        }
                      }
                      billPayItem.comment = payComment;
                      if (billPayDoc.hotelpms_billPay.postedUser) {
                        billPayItem.user =
                          billPayDoc.hotelpms_billPay.postedUser;
                      } else {
                        billPayItem.user = "";
                      }
                      billPays.push(billPayItem);
                    }
                  });
                  flist = bills.concat(billPays);
                  flist.sort(compareDate);
                  data.roomCharge = parseFloat(totalRC);
                  data.extraCharge = parseFloat(totalEC);
                  data.totalAmount = parseFloat(totalCharge);
                  data.totalPaid = parseFloat(totalPaid);
                  data.balance =
                    parseFloat(totalCharge) - parseFloat(totalPaid);
                  deferred.resolve(flist, { totalCount: flist.length });
                });
            });
        });
        return deferred.promise();
      },
    });
    folios.dataSource = new BizPro.data.DataSource({ store: folioCustomStore });
    folios.column.push({ caption: app.localize("Date"), dataField: "date" });
    folios.column.push({
      caption: app.localize("Room"),
      dataField: "roomName",
    });
    folios.column.push({
      caption: app.localize("ItemName"),
      dataField: "itemName",
    });
    folios.column.push({
      caption: app.localize("Amount"),
      dataField: "calculatedTotal",
    });
    folios.column.push({ caption: app.localize("User"), dataField: "user" });
    folios.column.push({
      caption: app.localize("Action"),
      cellTemplate: function (element, info) {
        var buttonDropDown = $("<button>", {
          type: "button",
          class: "btn btn-outline-primary dropdown-toggle",
          "data-toggle": "dropdown",
          "aria-haspopup": "true",
          "aria-expanded": "false",
        });
        var iitem = $("<i>", { class: "fas fa-cog" });
        buttonDropDown.append(iitem).append("Action");
        var btnContainer = $("<div>", { class: "dropdown-menu pull-right" });
        if (info.data.typeId === 1) {
          var btnEditBill = $("<div>", { class: "dropdown-item" }).append(
            $("<a>", {
              class: "buttonEditBill",
              value: info.data.id,
              id: "buttonEditBill",
              href: "#",
              text: app.localize("Edit"),
            })
          );
          var btnVoidBill = $("<div>", { class: "dropdown-item" }).append(
            $("<a>", {
              class: "buttonVoidBill",
              value: info.data.id,
              id: "buttonVoidBill",
              href: "#",
              text: app.localize("Void"),
            })
          );
          btnContainer.append(btnEditBill).append(btnVoidBill);
        }
        if (info.data.typeId === 2) {
          var btnEditBillPay = $("<div>", { class: "dropdown-item" }).append(
            $("<a>", {
              class: "buttonEditBillPay",
              value: info.data.id,
              id: "buttonEditBill",
              href: "#",
              text: app.localize("Edit"),
            })
          );
          var btnVoidBillPay = $("<div>", { class: "dropdown-item" }).append(
            $("<a>", {
              class: "buttonVoidBillPay",
              value: info.data.id,
              id: "buttonVoidBill",
              href: "#",
              text: app.localize("Void"),
            })
          );
          btnContainer.append(btnEditBillPay).append(btnVoidBillPay);
        }

        element.append(buttonDropDown).append(btnContainer);
      },
    });
    folios.dataTable = folios.$table.etDataGrid({
      dataSource: folios.dataSource,
      paging: {
        pageSize: 25,
      },
      pager: {
        showPageSizeSelector: true,
        showInfo: true,
        allowedPageSizes: [25, 50, 100, 500],
      },
      onCellPrepared(options) {},
      searchPanel: {
        visible: false,
        highlightCaseSensitive: true,
      },
      groupPanel: {
        visible: false,
      },
      grouping: {
        autoExpandAll: true,
      },
      allowColumnReordering: true,
      rowAlternationEnabled: true,
      wordWrapEnabled: true,
      hoverStateEnabled: true,
      showBorders: true,
      cellHintEnabled: true,
      columnFixing: {
        enabled: true,
      },
      columns: folios.column,
      onRowDblClick: function (e) {
        var id = e.data.id;
      },
      onCellPrepared: function (e) {
        //console.log(e);
      },
    });
  },
};

function fnLoadBookedRoomData() {
  var deferred = $.Deferred();
  if (data.bookingInited !== true) {
    data.bookingInited = true;
    _resourceManager.getResourceById(data.bookedRoomId).done(function (result) {
      var doc = JSON.parse(result.document);
      data.guest = doc.guest;
      data.guestId = doc.guest_id;
      (data.reservedDate = doc.reservedDate), (data.arrival = doc.startDate);
      data.departure = doc.endDate;
      data.adult = doc.adult;
      data.child = doc.child;
      data.pax = doc.adult.toString() + "/" + doc.child.toString();
      data.rateType = doc.rateType;
      data.company = doc.company;
      data.room = doc.room;
      data.roomType = doc.roomType;
      data.status = doc.status;

      deferred.resolve({ triggerChange: true });
    });
  } else {
    deferred.resolve({ triggerChange: false });
  }
  return deferred.promise();
}

function isNotEmpty(value) {
  return value !== undefined && value !== null && value !== "";
}

function findRate(rateCode, currencies) {
  var index = 0,
    found,
    entry,
    isFound = false;
  for (index = 0; index < currencies.length; ++index) {
    entry = currencies[index];
    if (entry.code == rateCode) {
      isFound = true;
      found = entry;
      break;
    }
  }
  if (isFound) {
    return found.rate;
  } else {
    return 1;
  }
}

function compareDate(a, b) {
  if (a.date < b.date) {
    return -1;
  }
  if (a.date > b.date) {
    return 1;
  }
  return a.typeId - b.typeId;
}
