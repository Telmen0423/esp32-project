//event_1: Arrived - Irsen zochin Color after check in
//event_2: Checked Out - Tootsoogoo hiisen
//event_3: Due Out - unuudur garah zochin
//event_4: Confirmed Reservation - Batalgaajsan zahialga
//event_5: Maintenance block
//event_6: Stay over - uldsen (uldsen)
//event_7: Dayuse Reservation - Udriin zahialga
//event_8: Dayuse - udur tsagaar avsan.
//event_9: Dayuse + Checkout ???

(function () {
  $(function () {
    var _taskStartModal = app.StartTaskModal();
    var _dynamicEntityManager = abp.services.app.dynamicEntity;

    var allData,
      totalTax = 0,
      workingDateGlobal,
      hotelConfig = {};
    var tenantId = abp.session.tenantId;
    var loadFilter = { filter: "" };
    var first = true;

    const LOCAL_STORAGE_KEY_HOTELPMS_HOURLY = "hotelpms_hourly_" + tenantId;
    const LOCAL_STORAGE_KEY_HOTELPMS_TAX = "hotelpms_total_tax_" + tenantId;
    const LOCAL_STORAGE_KEY_HOTELPMS_ROOM = "hotelpms_room_" + tenantId;
    const LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE = "hotelpms_roomType_" + tenantId;
    const LOCAL_STORAGE_KEY_HOTELPMS_CONFIG = "hotelpms_config" + tenantId;

    var reservationList = {
      $table: $("#reservationLists"),
      $organizationTitle: $("#kt_subheader span"),
      $resourceTitle: $("#kt_subheader h5"),
      dataSource: null,
      column: [],
      dataTable: null,

      init: function () {
        if (first) {
          reservationList.getHotelConfig().done(function (configure) {
            if (configure) {
              hotelConfig = JSON.parse(configure);
              var wDay = hotelConfig.workingDate;
              workingDateGlobal = abp.timing
                .convertToUserTimezone(wDay)
                .startOf("day");
            }
            var systemDate = moment()
              .tz(abp.timing.timeZoneInfo.iana.timeZoneId)
              .format("YYYY, MM сарын DD");
            var workDateText = abp.timing
              .convertToUserTimezone(workingDateGlobal)
              .format("YYYY, MM сарын DD");
            $("#kt_footerInfo").append(
              $("<span />", {
                text: app.localize("SystemDate") + ": " + systemDate,
                class: "text-muted",
              })
            );
            $("#kt_footerInfo").append(
              $("<span />", {
                text: app.localize("WorkingDate") + ": " + workDateText,
                class: "text-primary pl-2",
              })
            );
            totalTax = reservationList.getTotalTax();
          });
        }

        reservationList.column = [];
        reservationList.initDataGrid();
      },

      initDataGrid: function () {
        var customStore = new BizPro.data.CustomStore({
          key: "id",
          load: function (loadOptions) {
            var deferred = $.Deferred();
            var params = {};
            [
              "filter",
              "group",
              "groupSummary",
              "parentIds",
              "requireGroupCount",
              "requireTotalCount",
              "searchExpr",
              "searchOperation",
              "searchValue",
              "select",
              "sort",
              "skip",
              "take",
              "totalSummary",
              "userData",
            ].forEach(function (i) {
              if (i in loadOptions && isNotEmpty(loadOptions[i])) {
                params[i] = JSON.stringify(loadOptions[i]);
              }
            });
            _dynamicEntityManager
              .getResourcesByKeyFilter("hotelpms_bookedRooms", loadFilter)
              .done(function (bookedRoomResults) {
                allData = [];
                rowId = 0;
                //console.log("DATA ", bookedRoomResults);
                _dynamicEntityManager
                  .getResourcesByKey("hotelpms_color")
                  .done(function (statusResults) {
                    $.each(
                      bookedRoomResults.items,
                      function (rtIndex, bookedRoomResult) {
                        var document = JSON.parse(bookedRoomResult.document);
                        var findcolor = undefined;
                        //console.log("data in loop :", document);
                        var sStartDate = moment(document.startDate).format(
                          "YYYY-MM-DD HH:mm:ss"
                        );
                        var sEndDate = moment(document.endDate).format(
                          "YYYY-MM-DD HH:mm:ss"
                        );
                        var currentDate = new Date();
                        let data = {
                          id: bookedRoomResult.id,
                          roomType: document.roomType,
                          userName: document.description,
                          currentDate: currentDate,
                          startDate: sStartDate,
                          endDate: sEndDate,
                          arrival: sStartDate,
                          departure: sEndDate,
                          adult: document.adult,
                          child: document.child,
                          roomStatus: document.status,
                          rowId: rowId,
                          booking_id: document.booking_id,
                          rateType: document.rateType,
                          guest: document.guest,
                          refId: document.refId,
                          booking: document.booking,
                          bookingId: document.booking_id,
                        };
                        if (document.room) {
                          (data.roomNumber = document.room.data.name),
                            (data.room = document.room),
                            (data.roomTypeId = document.room.id);
                        }

                        $.each(statusResults, function (Index, statusResult) {
                          var statusJson = JSON.parse(statusResult.document);
                          //console.log("data in LOOP_2nd:", statusJson);
                          if (document.status == statusJson.statusValue) {
                            findcolor = 1;
                            data.backGroundColor = statusJson.backGroundColor;
                            data.textColor = statusJson.textColor;
                            data.roomStatusName = statusJson.statusName;
                          }
                        });

                        if (findcolor == undefined) {
                          switch (data.roomStatus) {
                            case 1:
                              data.backGroundColor = "#578EBE";
                              data.textColor = "#FFFFFF";
                              data.roomStatusName = "Arrived";
                              break;
                            case 2:
                              data.backGroundColor = "#32085e";
                              data.textColor = "#FFFFFF";
                              data.roomStatusName = "Checked Out";
                              break;
                            case 3:
                              data.backGroundColor = "#E43A45";
                              data.textColor = "#FFFFFF";
                              data.roomStatusName = "Due Out";
                              break;
                            case 4:
                              data.backGroundColor = "#1BA39C";
                              data.textColor = "#FFFFFF";
                              data.roomStatusName = "Confirmed Reservation";
                              break;
                            case 5:
                              data.backGroundColor = "#F3C200";
                              data.textColor = "#FFFFFF";
                              data.roomStatusName = "Maintenance Block";
                              break;
                            case 6:
                              data.backGroundColor = "#2C3E50";
                              data.textColor = "#f0f0f0";
                              data.roomStatusName = "Stay Over";
                              break;
                            case 7:
                              data.backGroundColor = "#8775A7";
                              data.textColor = "#FFFFFF";
                              data.roomStatusName = "Day Use Reservation";
                              break;
                            case 8:
                              data.backGroundColor = "Day Use";
                              data.textColor = "#8E44AD";
                              data.roomStatusName = "#FFFFFF";
                              break;
                            default:
                              data.backGroundColor = "#000000";
                              data.textColor = "#FFFFFF";
                              data.roomStatusName = "unknown";
                              break;
                          }
                        }
                        allData.push(data);
                        rowId++;
                      }
                    );
                    deferred.resolve(allData);
                  });
              });
            return deferred.promise();
          },
        });

        var height = $(window).height();
        reservationList.$table.height(height - 300);

        reservationList.column.push({
          dataField: "$action_column",
          caption: app.localize("Actions"),
          cellTemplate: function (container, options) {
            //console.log("options", options);
            let optionItems = [
              { text: app.localize("Edit"), command: 1, value: options.data },
              {
                text: app.localize("Edit Transaction"),
                command: 2,
                value: options.data,
              },
              {
                text: app.localize("Checked in"),
                command: 3,
                value: options.data,
              },
              {
                text: app.localize("Checked out"),
                command: 4,
                value: options.data,
              },
              {
                text: app.localize("PaymentandDeposit"),
                command: 5,
                value: options.data,
              },
              {
                text: app.localize("Extra charge"),
                command: 6,
                value: options.data,
              },
              {
                text: app.localize("Bill Detail"),
                command: 7,
                value: options.data,
              },
              {
                text: app.localize("Room Unassignment"),
                command: 8,
                value: options.data,
              },
              {
                text: app.localize("Assign Room"),
                command: 9,
                value: options.data,
              },
              {
                text: app.localize("Void transaction"),
                command: 10,
                value: options.data,
              },
              {
                text: app.localize("Cancel Reservation"),
                command: 11,
                value: options.data,
              },
              {
                text: app.localize("No show"),
                command: 12,
                value: options.data,
              },
              {
                text: app.localize("Room move"),
                command: 13,
                value: options.data,
              },
              {
                text: app.localize("Amend stay"),
                command: 14,
                value: options.data,
              },
              {
                text: app.localize("AuditTrail"),
                command: 15,
                value: options.data,
              },
            ];

            let filteredItems = optionItems.filter((item) => {
              //console.log("Option", options);
              if (options.data.roomStatus) {
                var status = parseInt(options.data.roomStatus);
                switch (status) {
                  case 0:
                  case 4:
                  case 7:
                    if (
                      abp.timing
                        .convertToUserTimezone(workingDateGlobal)
                        .startOf("day")
                        .diff(
                          abp.timing
                            .convertToUserTimezone(options.data.arrival)
                            .startOf("day"),
                          "days"
                        ) === 0
                    ) {
                      if (options.data.room && options.data.room.data) {
                        return item.command != 4 && item.command != 9;
                        //item.command == 1 || item.command == 7 || item.command == 15 || item.command == 13 || item.command == 14 ||
                        //    item.command == 11 || item.command == 6 || item.command == 5 || item.command == 10 || item.command == 3 ||
                        //    item.command == 12 || item.command == 8 || item.command == 2;
                      } else {
                        return item.command != 4 && item.command != 8;
                        //item.command == 1 || item.command == 7 || item.command == 15 || item.command == 13 || item.command == 14 ||
                        //    item.command == 11 || item.command == 6 || item.command == 5 || item.command == 10 || item.command == 3 ||
                        //    item.command == 12 || item.command == 9 || item.command == 2;
                      }
                    } else {
                      if (options.data.room && options.data.room.data) {
                        return (
                          item.command != 3 &&
                          item.command != 4 &&
                          item.command != 9 &&
                          item.command != 12
                        );
                        //item.command == 1 || item.command == 7 || item.command == 15 || item.command == 13 || item.command == 14 ||
                        //    item.command == 11 || item.command == 6 || item.command == 5 || item.command == 10 ||
                        //    item.command == 8 || item.command == 2;
                      } else {
                        return (
                          item.command != 3 &&
                          item.command != 4 &&
                          item.command != 8 &&
                          item.command != 12
                        );
                        //item.command == 1 || item.command == 7 || item.command == 15 || item.command == 13 || item.command == 14 ||
                        //    item.command == 11 || item.command == 6 || item.command == 5 || item.command == 10 ||
                        //    item.command == 9 || item.command == 2;
                      }
                    }
                  case 1:
                  case 3:
                  case 6:
                  case 8:
                    var remaining = abp.timing
                      .convertToUserTimezone(workingDateGlobal)
                      .startOf("day")
                      .diff(
                        abp.timing
                          .convertToUserTimezone(options.data.departure)
                          .startOf("day"),
                        "days"
                      );
                    if (status === 8) {
                      return (
                        item.command != 3 &&
                        item.command != 8 &&
                        item.command != 9 &&
                        item.command != 11 &&
                        item.command != 12 &&
                        item.command != 13
                      );
                      //item.command == 1 || item.command == 2 || item.command == 14 || item.command == 6 || item.command == 5 ||
                      //    item.command == 10 || item.command == 4 || item.command == 7 || item.command == 15;
                    } else {
                      if (parseInt(remaining) === 0) {
                        return (
                          item.command != 3 &&
                          item.command != 8 &&
                          item.command != 9 &&
                          item.command != 11 &&
                          item.command != 12
                        );
                        //item.command == 1 || item.command == 2 || item.command == 14 || item.command == 6 || item.command == 5 ||
                        //    item.command == 10 || item.command == 13 || item.command == 4 || item.command == 7 || item.command == 15;
                      }
                      return (
                        item.command != 3 &&
                        item.command != 8 &&
                        item.command != 9 &&
                        item.command != 11 &&
                        item.command != 12 &&
                        item.command != 4
                      );
                      //item.command == 1 || item.command == 2 || item.command == 14 || item.command == 6 || item.command == 5 ||
                      //    item.command == 10 || item.command == 13 || item.command == 7 || item.command == 15;
                    }
                  case 2:
                  case 9:
                    return (
                      item.command == 1 ||
                      item.command == 7 ||
                      item.command == 15
                    );
                  default:
                    return item.command == 7 || item.command == 15;
                }
              }
              return item;
              //item.command == 15;
            });

            $("<div>")
              .appendTo(container)
              .etMenu({
                items: [
                  {
                    icon: "preferences",
                    items: filteredItems,
                  },
                ],
                showFirstSubmenuMode: "onClick",
                hideSubmenuOnMouseLeave: true,
                onItemClick: function (param) {
                  switch (param.itemData.command) {
                    case 1:
                      openRowDetails(param);
                      break;
                    //case 2: editTransaction(param); break;
                    //case 3: checkIn(param); break;
                    //case 4: checkOut(param); break;
                    //case 5: paymentandDeposit(param); break;
                    //case 6: extraCharge(param); break;
                    //case 7: billDetail(param); break;
                    //case 8: roomUnassignment(param); break;
                    //case 9: asignRoom(param); break;
                    //case 10: voidTransaction(param); break;
                    //case 11: cancelReservation(param); break;
                    //case 12: noShow(param); break;
                    //case 13: roomMove(param); break;
                    //case 14: amendStay(param); break;
                    //case 15: auditTrail(param); break;
                  }
                },
              });
          },
        }),
          reservationList.column.push({
            caption: app.localize("Room type"),
            dataField: "roomType.data.name",
          });

        reservationList.column.push({
          caption: app.localize("Room number"),
          dataField: "roomNumber",
        });

        reservationList.column.push({
          caption: app.localize("Name"),
          dataField: "userName",
        });

        reservationList.column.push({
          caption: app.localize("Start date"),
          dataField: "startDate",
        });

        reservationList.column.push({
          caption: app.localize("End date"),
          dataField: "endDate",
        });

        reservationList.column.push({
          caption: app.localize("Status"),
          dataField: "roomStatusName",
        });

        reservationList.column.push({
          caption: app.localize("Adult"),
          dataField: "adult",
          visible: false,
        });

        reservationList.column.push({
          caption: app.localize("Child"),
          dataField: "child",
          visible: false,
        });

        reservationList.dataTable = reservationList.$table.etDataGrid({
          dataSource: customStore,
          paging: {
            pageSize: 25,
          },
          pager: {
            showPageSizeSelector: true,
            showInfo: true,
            allowedPageSizes: [25, 50, 100, 500],
          },
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
          export: {
            enabled: true,
            // allowExportSelectedData: true
          },
          onExporting(e) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Reservation");

            BizPro.excelExporter
              .exportDataGrid({
                component: e.component,
                worksheet,
                autoFilterEnabled: true,
                topLeftCell: { row: 2, column: 2 },
                customizeCell(options) {
                  const { gridCell } = options;
                  const { excelCell } = options;
                  if (gridCell.rowType === "group") {
                    excelCell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "BEDFE6" },
                    };
                  }
                  excelCell.showBorders = true;
                },
              })
              .then(() => {
                workbook.xlsx.writeBuffer().then((buffer) => {
                  saveAs(
                    new Blob([buffer], { type: "application/octet-stream" }),
                    "Reservation.xlsx"
                  );
                });
              });
            e.cancel = true;
          },
          columnChooser: {
            enabled: true,
            allowSearch: true,
            mode: "select",
          },
          searchPanel: {
            visible: true,
            width: 240,
            placeholder: "Search...",
          },
          allowColumnReordering: true,
          rowAlternationEnabled: true,
          wordWrapEnabled: true,
          hoverStateEnabled: true,
          showBorders: true,
          showRowLines: true,
          cellHintEnabled: true,
          filterRow: { visible: true },
          filterPanel: { visible: true },
          headerFilter: { visible: true },
          columnFixing: { enabled: true },
          columns: reservationList.column,
          onCellPrepared: function (e) {
            if (e.rowType === "data") {
              if (e.column.caption === "Status") {
                e.cellElement.css({
                  color: e.data.textColor,
                  "background-color": e.data.backGroundColor,
                });
              }
            }
          },
        });
      },

      getTotalTax() {
        if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX)) {
          _dynamicEntityManager
            .getResourcesByKey("hotelpms_tax")
            .done(function (taxes) {
              var totalTax = 0;
              $.each(taxes, function (index, tax) {
                var taxDoc = JSON.parse(tax.document);
                if (taxDoc.rate) {
                  totalTax = totalTax + taxDoc.rate;
                }
              });
              localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX, totalTax);
              return totalTax;
            });
        } else {
          return localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX);
        }
      },
      getRoomTypes() {
        var roomTypes = $.Deferred();
        if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE)) {
          var loadOptions = {
            filter: "",
            sort: '[{ "selector": "sortOrder", "desc": false }]',
          };
          _dynamicEntityManager
            .getResourcesByKeyFilter("hotelpms_roomType", loadOptions)
            .done(function (roomTypesResult) {
              var json = JSON.stringify(roomTypesResult);
              roomTypes.resolve(json);
              localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE, json);
            });
        } else {
          roomTypes.resolve(
            localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE)
          );
        }
        return roomTypes.promise();
      },
      currentResource: {
        data: null,
        set: function (data) {
          var deferred = $.Deferred();

          var _tenantId = "";
          if (app.session.tenant) {
            _tenantId = app.session.tenant.id;
          }

          var _userId = "";
          if (app.session.user) {
            _userId = app.session.user.id;
          }

          if (data) {
            reservationList.currentResource.data = data;
            reservationList.$organizationTitle.text(
              data.organizationUnit.displayName
            );
            reservationList.$resourceTitle.text(data.resource.name);

            app.localStorage.setItem(
              "bizpro.app.reservationList.selectedResource_" +
                _tenantId +
                "_" +
                _userId,
              JSON.stringify(data)
            );
            deferred.resolve(data);
          } else {
            reservationList.currentResource.data = null;
            reservationList.$organizationTitle.text(
              app.localize("OrganizationResources")
            );
            reservationList.$resourceTitle.text(app.localize("SelectResource"));
          }

          return deferred.promise();
        },
        get: function () {
          var deferred = $.Deferred();

          var _tenantId = "";
          if (app.session.tenant) {
            _tenantId = app.session.tenant.id;
          }

          var _userId = "";
          if (app.session.user) {
            _userId = app.session.user.id;
          }

          if (reservationList.currentResource.data == null) {
            app.localStorage.getItem(
              "bizpro.app.reservationList.selectedResource_" +
                _tenantId +
                "_" +
                _userId,
              function (localData) {
                var localDataJson = JSON.parse(localData);
                reservationList.currentResource.data = localDataJson;
                deferred.resolve(localDataJson);
              }
            );
          } else {
            deferred.resolve(reservationList.currentResource.data);
          }
          return deferred.promise();
        },
      },
      getHotelConfig() {
        var config = $.Deferred();
        //localStorage.removeItem("hotelpms_config");
        if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG)) {
          _dynamicEntityManager
            .getResourcesByKey("hotelpms_config")
            .done(function (configResult) {
              if (configResult) {
                if (configResult.length > 0) {
                  var configParsed = JSON.parse(configResult[0].document);
                  configParsed.id = configResult[0].id;
                  var jString = JSON.stringify(configParsed);
                  config.resolve(jString);
                  localStorage.setItem(
                    LOCAL_STORAGE_KEY_HOTELPMS_CONFIG,
                    jString
                  );
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
        } else {
          config.resolve(
            localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG)
          );
        }
        return config.promise();
      },
      getRooms() {
        var rooms = $.Deferred();
        if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM)) {
          var loadOptions = {
            filter: "",
            sort: '[{ "selector": "sortOrder", "desc": false }]',
          };
          _dynamicEntityManager
            .getResourcesByKeyFilter("hotelpms_room", loadOptions)
            .done(function (roomResult) {
              var json = JSON.stringify(roomResult);
              rooms.resolve(json);
              localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM, json);
            });
        } else {
          rooms.resolve(localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM));
        }
        return rooms.promise();
      },
    };

    reservationList.init();

    function isNotEmpty(value) {
      return value !== undefined && value !== null && value !== "";
    }

    abp.event.on("app.taskCompleted", function (arg) {
      console.log("app.taskCompleted");
      if (arg.appCode == "RLFR") {
        var filterValue = JSON.parse(arg.document);
        console.log("filterValue = ", filterValue);
        var filterString = "";
        if (filterValue.unconfirmedBooking === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","0"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","0"]';
          }
        }
        if (filterValue.arrived === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","1"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","1"]';
          }
        }
        if (filterValue.checkedOut === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","2"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","2"]';
          }
          console.log("loadOpion", filterString);
        }
        if (filterValue.dueOut === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","3"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","3"]';
          }
        }
        if (filterValue.confirmedReservation === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","4"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","4"]';
          }
        }
        if (filterValue.maintenanceBlock === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","5"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","5"]';
          }
        }
        if (filterValue.stayOver === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","6"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","6"]';
          }
        }
        if (filterValue.dayUseReservation === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","7"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","7"]';
          }
        }
        if (filterValue.dayUse === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","8"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","8"]';
          }
        }
        if (filterValue.hourlyCheckOut === true) {
          if (filterString === "undefined" || filterString === "") {
            filterString += "[[";
            filterString += '["status","=","9"]';
          } else {
            filterString += ',"or",';
            filterString += '["status","=","9"]';
          }
        }
        if (filterString !== "undefined" && filterString !== "") {
          filterString += "]";
        }

        if (
          filterValue.dateIntervalCheckButton === false &&
          filterValue.time !== "undefined" &&
          filterValue.time !== ""
        ) {
          if (filterString !== "undefined" && filterString !== "") {
            filterString += ',"and",';
          } else {
            filterString += "[";
          }
          var currentDate = new Date();
          switch (filterValue.time) {
            case "today":
              filterString +=
                '[["startDate","<=","' +
                abp.timing
                  .convertToUserTimezone(currentDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"and",["endDate",">=","' +
                abp.timing
                  .convertToUserTimezone(currentDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]';
              break;
            case "yesderday":
              var yesterday = new Date(
                currentDate.setDate(currentDate.getDate() - 1)
              );
              filterString +=
                '[["startDate","<=","' +
                abp.timing
                  .convertToUserTimezone(yesterday)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"and",["endDate",">=","' +
                abp.timing
                  .convertToUserTimezone(yesterday)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]';
              break;
            case "tomorrow":
              var tomorrow = new Date(
                currentDate.setDate(currentDate.getDate() + 1)
              );
              filterString +=
                '[["startDate","<=","' +
                abp.timing
                  .convertToUserTimezone(tomorrow)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"and",["endDate",">=","' +
                abp.timing
                  .convertToUserTimezone(tomorrow)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]';
              break;
            case "thisWeek":
              var weekStartDate = new Date(
                currentDate.setDate(
                  currentDate.getDate() - currentDate.getDay()
                )
              );
              var weekEndDate = new Date(
                currentDate.setDate(
                  currentDate.getDate() - currentDate.getDay() + 6
                )
              );
              filterString +=
                '[[["startDate",">=","' +
                abp.timing
                  .convertToUserTimezone(weekStartDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"or",["endDate",">=","' +
                abp.timing
                  .convertToUserTimezone(weekStartDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]';
              filterString += ',"and",';
              filterString +=
                '[["startDate","<=","' +
                abp.timing
                  .convertToUserTimezone(weekEndDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"or",["endDate","<=","' +
                abp.timing
                  .convertToUserTimezone(weekEndDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]]';
              break;
            case "thisMonth":
              var monthStartDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
              );
              var monthEndDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
              );
              filterString +=
                '[[["startDate",">=","' +
                abp.timing
                  .convertToUserTimezone(monthStartDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"or",["endDate",">=","' +
                abp.timing
                  .convertToUserTimezone(monthStartDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]';
              filterString += ',"and",';
              filterString +=
                '[["startDate","<=","' +
                abp.timing
                  .convertToUserTimezone(monthEndDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"or",["endDate","<=","' +
                abp.timing
                  .convertToUserTimezone(monthEndDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]]';
              break;
            case "thisYear":
              var yearStartDate = new Date(currentDate.getFullYear(), 0, 1);
              var yearEndDate = new Date(currentDate.getFullYear(), 11, 31);
              filterString +=
                '[[["startDate",">=","' +
                abp.timing
                  .convertToUserTimezone(yearStartDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"or",["endDate",">=","' +
                abp.timing
                  .convertToUserTimezone(yearStartDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]';
              filterString += ',"and",';
              filterString +=
                '[["startDate","<=","' +
                abp.timing
                  .convertToUserTimezone(yearEndDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"],"or",["endDate","<=","' +
                abp.timing
                  .convertToUserTimezone(yearEndDate)
                  .startOf("day")
                  .format("YYYY-MM-DD") +
                '::date"]]]';
              break;
          }
        } else {
          if (filterValue.startDate && filterValue.endDate) {
            if (filterString !== "undefined" && filterString !== "") {
              filterString += ',"and",';
            } else {
              filterString += "[";
            }
            filterString +=
              '[[["startDate",">=","' +
              abp.timing
                .convertToUserTimezone(filterValue.startDate)
                .startOf("day")
                .format("YYYY-MM-DD") +
              '::date"],"or",["endDate",">=","' +
              abp.timing
                .convertToUserTimezone(filterValue.startDate)
                .startOf("day")
                .format("YYYY-MM-DD") +
              '::date"]]';
            filterString += ',"and",';
            filterString +=
              '[["startDate","<=","' +
              abp.timing
                .convertToUserTimezone(filterValue.endDate)
                .startOf("day")
                .format("YYYY-MM-DD") +
              '::date"],"or",["endDate","<=","' +
              abp.timing
                .convertToUserTimezone(filterValue.endDate)
                .startOf("day")
                .format("YYYY-MM-DD") +
              '::date"]]]';
          }
        }
        if (filterString !== "undefined" && filterString !== "") {
          filterString += "]";
        }
        console.log("filterString", filterString);
        loadFilter = { filter: filterString };
        first = false;
        reservationList.init();
      }
      if (arg.appCode == "RLFO") {
        var finalData = JSON.parse(arg.document);
        console.log("appdoneData:", finalData);

        //var testfilter = { filter: '["id", "=","' + finalData.bookingId + '"]' };
        //console.log("appdoneData:", testfilter);

        //_dynamicEntityManager.getResourcesByKeyFilter('hotelpms_bookedRooms', testfilter).done(function (test) {
        //    console.log("all data:", test);
        //})

        _dynamicEntityManager
          .getResourceById(finalData.bookingId)
          .done(function (arg) {
            console.log("arg data:", arg);
            var document1 = JSON.parse(arg.document);
            console.log("changed data:", document1);
          });
      }
      if (
        arg.appCode == "CI01" ||
        arg.appCode == "CO01" ||
        arg.appCode == "RM02"
      ) {
        reservationList.init();
      }
    });

    $("#reservationFilter").on("click", function () {
      var formData = {
        id: 0,
        modalOptions: { modalSize: "xl" },
      };
      _taskStartModal.open({
        appCode: "RLFR",
        formData: JSON.stringify(formData),
      });
    });

    $("#reservationFilterClear").on("click", function () {
      loadFilter = { filter: "" };
      reservationList.init();
    });

    var openRowDetails = function (arg) {
      var formData = getFormData(arg);
      console.log("openRowDetails", formData);
      _taskStartModal.open({
        appCode: "UB01",
        formData: JSON.stringify(formData),
      });
    };

    var editTransaction = function (arg) {
      let allData = getFormData(arg);
      getBills(allData);
      var pax = allData.adult.toString() + "/" + allData.child.toString();
      allData.pax = pax;
      allData.currentDate = abp.timing.convertToUserTimezone(
        allData.currentDate
      );
      allData.workingDate = abp.timing.convertToUserTimezone(
        allData.workingDate
      );
      allData.balance =
        parseFloat(allData.totalAmount) - parseFloat(allData.totalPaid);
      allData.totalAmount = parseFloat(allData.totalAmount);
      allData.bookedRoomId = allData.id;
      allData.totalPaid = parseFloat(allData.totalPaid);
      var formData = allData;
      _taskStartModal.open({
        appCode: "ET01",
        formData: JSON.stringify(formData),
      });
    };

    var checkIn = function (arg) {
      let allData = getFormData(arg);
      getBills(allData);
      var hourly = parseInt(allData.status) === 7 ? true : false;
      allData.hourly = hourly;
      allData.currentDeparture = allData.departure;
      (allData.currentDate = abp.timing.convertToUserTimezone(arg.currentDate)),
        (allData.modalOptions = {
          modalSize: "xl",
          modalTitle: arg.itemData.value.userName,
        });
      var formData = allData;
      _taskStartModal.open({
        appCode: "CI01",
        formData: JSON.stringify(formData),
      });
    };
    // TODO toLocate some data.s undefined
    var checkOut = function (arg) {
      let allData = getFormData(arg);
      getBills(allData);
      var hourly = parseInt(allData.status) === 8 ? true : false;
      allData.hourly = hourly;
      allData.currentDeparture = allData.departure;
      allData.deposit = allData.totalPaid;
      allData.totalPayment = allData.totalPaid;
      allData.currentDate = abp.timing.convertToUserTimezone(
        allData.currentDate
      );
      allData.workingDate = abp.timing.convertToUserTimezone(
        allData.workingDate
      );
      allData.modalOptions = {
        modalSize: "xl",
        modalTitle: arg.itemData.value.userName,
      };
      var formData = allData;
      console.log("CO01 formData", formData);
      _taskStartModal.open({
        appCode: "CO01",
        formData: JSON.stringify(formData),
      });
    };
    // TODO zarim statusiig shalgah
    var roomMove = function (arg) {
      var roomId;
      let allData = getFormData(arg);
      getBills(allData);
      console.log("RoomMove data", allData);
      if (allData.room.id !== undefined) {
        roomId = allData.room.id;
      }

      allData.currentDate = abp.timing.convertToUserTimezone(currentDate);
      allData.workingDate = abp.timing.convertToUserTimezone(workingDateGlobal);
      var workingDate = abp.timing
        .convertToUserTimezone(allData.workingDate)
        .startOf("day");
      var endDate = abp.timing
        .convertToUserTimezone(allData.departure)
        .endOf("day");
      var currentDate = new Date();

      allData.overrideRoomRate = false;
      allData.currentRateType = allData.rateType;
      allData.currentRoom = allData.room;
      allData.currentRoomId = roomId;
      allData.currentRoomType = allData.roomType;
      allData.currentPax = allData.adult + "/" + allData.child;
      allData.totalNights = parseInt(allData.duration);
      allData.modalOptions = { modalSize: "xl" };

      if (
        abp.timing.convertToUserTimezone(allData.arrival).startOf("day") <
        workingDate
      ) {
        _dynamicEntityManager
          .getResourceById(allData.id)
          .done(function (currentBookedRoom) {
            allData.modalOpen = true;
            var currentBookedRoomData = JSON.parse(currentBookedRoom.document);
            formData.endDate = workingDate;
            formData.newStartDate = workingDate;
            formData.newEndDate = endDate;
            formData.pastEvent = "true";
            formData.newDescription = currentBookedRoomData.description;
            formData.newAdult = currentBookedRoomData.adult;
            formData.newChild = currentBookedRoomData.child;
            formData.newGroupColor = currentBookedRoomData.groupColor;
            formData.newRateType = currentBookedRoomData.rateType;

            var totalStayingDays = endDate
              .startOf("day")
              .diff(workingDate.startOf("day"), "days", false);
            formData.totalNights = totalStayingDays;

            _checkinModal.open({
              appCode: "RM02",
              formData: JSON.stringify(formData),
            });
          });
      } else {
        allData.modalOpen = true;
        allData.pastEvent = "false";
        var formData = allData;
        _taskStartModal.open({
          appCode: "RM02",
          formData: JSON.stringify(formData),
        });
      }
    };
    //  TODO Amend stay
    $(".btnAmendStay").on("click", function () {
      if (
        (!data.modalOpen || data.modalOpen === false) &&
        data.buttons !== undefined &&
        data.buttons.btnAmendStay === true
      ) {
        var roomId;
        if (data.room.id !== undefined) {
          roomId = data.room.id;
        }
        var _checkinModal = app.StartTaskModal();
        var formData = {
          di: data.id,
          bookingId: data.bookingId,
          refId: data.refId,
          room: data.room,
          roomType: data.roomType,
          rateType: data.rateType,
          arrival: abp.timing.convertToUserTimezone(data.arrival),
          departure: abp.timing.convertToUserTimezone(data.departure),
          currentArrival: abp.timing.convertToUserTimezone(data.arrival),
          currentDeparture: abp.timing.convertToUserTimezone(data.departure),
          status: data.status,
          totalNights: parseInt(data.duration),
          currentDate: abp.timing.convertToUserTimezone(data.currentDate),
          workingDate: abp.timing.convertToUserTimezone(data.workingDate),
          adult: data.adult,
          child: data.child,
          userId: data.userId,
          userName: data.userName,
          modalOptions: { modalSize: "xl" },
        };

        data.modalOpen = true;
        _checkinModal.open({
          appCode: "AS01",
          formData: JSON.stringify(formData),
        });

        _checkinModal.onClose(function () {
          data.modalOpen = false;
          $("#CloseButton").click();
        });
      }
    });

    var paymentandDeposit = function (arg) {
      let allData = getFormData(arg);
      allData.balance =
        parseFloat(allData.totalAmount) - parseFloat(allData.totalPaid);
      allData.totalCharge = parseFloat(allData.totalAmount);
      allData.totalPaid = parseFloat(allData.totalPaid);
      var formData = allData;
      console.log("formdata-after", formData);

      _taskStartModal.open({
        appCode: "DT01",
        formData: JSON.stringify(formData),
      });
    };

    var extraCharge = function (arg) {
      let allData = getFormData(arg);
      allData.status = parseInt(allData.status);
      allData.balance =
        parseFloat(allData.totalAmount) - parseFloat(allData.totalPaid);
      allData.totalCharge = parseFloat(allData.totalAmount);
      allData.totalPaid = parseFloat(allData.totalPaid);
      allData.arrival = abp.timing.convertToUserTimezone(allData.arrival);
      allData.currentDate = abp.timing.convertToUserTimezone(
        allData.currentDate
      );
      allData.workingDate = abp.timing.convertToUserTimezone(
        allData.workingDate
      );
      var formData = allData;
      console.log("formdata-after", formData);

      _taskStartModal.open({
        appCode: "EC01",
        formData: JSON.stringify(formData),
      });
    };

    var billDetail = function (arg) {
      let allData = getFormData(arg);
      var formData = allData;
      console.log("formdata-after", formData);
      _taskStartModal.open({
        appCode: "BD01",
        formData: JSON.stringify(formData),
      });
    };

    var roomUnassignment = function (arg) {
      var roomName;
      let allData = getFormData(arg);
      var formData = allData;
      if (formData.room) {
        roomName =
          allData.room.data.name + ", " + allData.roomType.data.shortName;
      } else {
        roomName = allData.roomType.data.name;
      }
      allData.arrival = abp.timing.convertToUserTimezone(allData.arrival);
      allData.departure = abp.timing.convertToUserTimezone(allData.departure);
      allData.roomName = roomName;
      allData.modalOptions = { modalSize: "md" };
      var formData = allData;
      console.log("formdata-after", formData);

      _taskStartModal.open({
        appCode: "RU01",
        formData: JSON.stringify(formData),
      });
    };

    var voidTransaction = function () {
      let allData = getFormData(arg);
      allData.currentDate = abp.timing.convertToUserTimezone(
        allData.currentDate
      );
      var formData = allData;
      console.log("formdata-after", formData);

      _taskStartModal.open({
        appCode: "VT01",
        formData: JSON.stringify(formData),
      });
    };

    var cancelReservation = function () {
      let allData = getFormData(arg);
      allData.currentDate = abp.timing.convertToUserTimezone(
        allData.currentDate
      );
      var formData = allData;
      console.log("formdata-after", formData);

      _taskStartModal.open({
        appCode: "CB01",
        formData: JSON.stringify(formData),
      });
    };

    var getFormData = function (arg) {
      var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
      var nowDate = abp.timing.convertToUserTimezone(now);
      var diffDuration = moment.duration(
        abp.timing
          .convertToUserTimezone(arg.itemData.value.endDate)
          .diff(abp.timing.convertToUserTimezone(arg.itemData.value.startDate))
      );
      diffDuration = Math.floor(diffDuration.asDays());
      var duration = diffDuration + " " + app.localize("Nights");
      if (diffDuration === 1) {
        duration = "1 " + app.localize("Night");
      } else {
        if (diffDuration === 0) {
          var dur = moment.duration(
            abp.timing
              .convertToUserTimezone(arg.event.end_date)
              .diff(abp.timing.convertToUserTimezone(arg.event.start_date))
          );
          duration = dur.asHours().toFixed(0) + " " + app.localize("Hour");
        }
      }
      var formData = {
        id: arg.itemData.value.id,
        refId: arg.event.refId,
        workingDate: workingDateGlobal,
        currentDate: nowDate,
        arrival: arg.itemData.value.startDate,
        departure: arg.itemData.value.endDate,
        room: arg.itemData.value.room,
        roomType: arg.itemData.value.roomType,
        adult: arg.itemData.value.adult,
        child: arg.itemData.value.child,
        status: arg.itemData.value.roomStatus,
        rateType: arg.itemData.value.rateType,
        guestName: arg.itemData.value.userName,
        duration: duration,
        bookingId: arg.itemData.value.booking_id,
        roomName: arg.itemData.value.roomNumber,
        totalTax: parseInt(totalTax),
        userId: app.session.user.id,
        userName: app.session.user.name,
        guest: arg.itemData.value.guest,
        refId: arg.itemData.value.refId,
        modalOptions: {
          hideSaveButton: true,
          modalSize: "xl",
          modalTitle: arg.itemData.value.userName,
        },
        booking: arg.itemData.value,
      };
      return formData;
    };

    var getBills = function (data) {
      var refId = 1;
      if (data.refId) {
        refId = data.refId;
      }
      if (data.bookingId) {
        var loadOptionsBill = {
          filter:
            '[["booking_id", "=", ' +
            data.bookingId +
            '],"and",["isDeleted","=",false]]',
        };
        console.log("loadoption", loadOptionsBill);

        _dynamicEntityManager
          .getResourcesByKeyFilter("hotelpms_bill", loadOptionsBill)
          .done(function (billresult) {
            var loadOptions = {
              filter: '["booking_id", "=", ' + data.bookingId + "]",
            };
            console.log("loadoptionNext", loadOptions);
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

                    data.billPays = $.map(
                      billPayResult.items,
                      function (billPay) {
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
                          deposit =
                            deposit + parseFloat(billPayData.amountCalculated);
                          return billPayData;
                        } else {
                          return null;
                        }
                      }
                    );

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
                        if (
                          !billData.chargeDate &&
                          billData.itemGroup === "Room"
                        ) {
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
                            calculatedTotal = Math.imul(
                              billData.totalAmount,
                              rate
                            );
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
                    if (!data.paidAmount) {
                      data.paidAmount = 0;
                    }
                    data.extraCharge = extraCharge.toLocaleString();
                    data.extraCharges = extraCharges;
                    data.balance = balanceString;
                    data.roomCharge = roomCharge.toLocaleString();
                    data.deposit = deposit.toLocaleString();
                    data.amount = amount.toLocaleString();
                    data.totalAmount = amount;
                    data.totalPaid = deposit;
                    data.baseCurrency = baseCurrency;
                  });
              });
          });
      }

      return data;
    };

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
  });
})();
