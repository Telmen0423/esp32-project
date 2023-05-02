//event_1: Arrived - Irsen zochin Color after check in
//event_2: Checked Out - Tootsoogoo hiisen
//event_3: Due Out - unuudur garah zochin
//event_4: Confirmed Reservation - Batalgaajsan zahialga
//event_5: Maintenance block
//event_6: Stay over - uldsen (uldsen)
//event_7: Dayuse Reservation - Udriin zahialga
//event_8: Dayuse - udur tsagaar avsan.
//event_9: Dayuse + Checkout ???

//calendar

(function () {
    $(function () {
        var _taskStartModal = app.StartTaskModal();
        var _managerResourceModal = app.ManageResourceModal();

        var _dynamicEntityManager = abp.services.app.dynamicEntity;
        var _reportManager = abp.services.app.report;
        var workingDateGlobal, totalTax = 0, folderBookings = [], summaryBookings = [], hourlyBookings = [], hotelConfig = {}, buildings = [], floors = [], roomTree = [], totalRoomCount = 0, selectedBuilding = null, selectedFloor = null, receptionSession = null;

        var tenantId = abp.session.tenantId;

        const LOCAL_STORAGE_KEY_HOTELPMS_HOURLY = 'hotelpms_hourly_' + tenantId;
        const LOCAL_STORAGE_KEY_HOTELPMS_TAX = 'hotelpms_total_tax_' + tenantId;
        const LOCAL_STORAGE_KEY_HOTELPMS_ROOM = 'hotelpms_room_' + tenantId;
        const LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE = 'hotelpms_roomType_' + tenantId;
        const LOCAL_STORAGE_KEY_HOTELPMS_CONFIG = 'hotelpms_config' + tenantId;

        var reservation = {
            init: function () {

                /*
                _managerResourceModal.open({
                    key: 'hotelpms_customer'
                });
                               
                _managerResourceModal.open({
                    id: 3849
                });*/

                totalTax = reservation.getTotalTax();
                reservation.getHotelConfig().done(function (configResolved) {
                    if (configResolved) {
                        hotelConfig = JSON.parse(configResolved);
                        var wDay = hotelConfig.workingDate;
                        workingDateGlobal = abp.timing.convertToUserTimezone(wDay).startOf('day');

                        // Making footer:
                        //  var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId).format('YYYY-MM-DD');
                        // abp.timing.convertToUserTimezone(workingDateGlobal).format('YYYY-MM-DD')
                        var systemDate = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId).format('YYYY, MM сарын DD');
                        var workDateText = abp.timing.convertToUserTimezone(workingDateGlobal).format('YYYY, MM сарын DD');
                        //$("#kt_footer").append($("<span />", { text: 'Системийн огноо: ' + systemDate }));
                        //$("#kt_footer").append($("<span />", { text: 'Ажлын огноо: ' + workDateText }));
                        $("#kt_footerInfo").append($("<span />", { text: app.localize("SystemDate") + ": " + systemDate, class: 'text-muted' }));
                        $("#kt_footerInfo").append($("<span />", { text: app.localize("WorkingDate") + ": " + workDateText, class: 'text-primary pl-2' }));
                        var _accountService = abp.services.app.account;
                        // TODO: Replace reception
                        _accountService.isReceptionist(abp.session.userId).done(function (isReception) {
                            if (isReception === true) {
                                var loadOptions = { filter: '["isActive", "=", true]' };
                                _dynamicEntityManager.getResourcesByKeyFilter('hotelpms_session', loadOptions).done(function (sessionResult) {
                                    if (sessionResult.items.length > 0) {
                                        var session = JSON.parse(sessionResult.items[0].document);
                                        session.id = sessionResult.items[0].id;
                                        if (session.receptionId === app.session.user.id) {
                                            receptionSession = session;
                                            reservation.initCalendar(workingDateGlobal);
                                        } else {
                                            // start new session here..
                                            var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
                                            //var formData = {
                                            //    message: "Receptionist: " + session.receptionName + " doesn't ended session yet, would you like to stop his(her) session and <br /> Start new session ?",
                                            //    receptionId: app.session.user.id,
                                            //    receptionName: app.session.user.name,
                                            //    receptionSurmame: app.session.user.surname,
                                            //    startDate: now, //moment(startingDate).format('MM/DD/YYYY'),
                                            //    workingDate: workingDateGlobal,
                                            //    endDate: now,
                                            //    endingCashBalance: 0 // TODO: read from balance
                                            //};
                                            //_taskStartModal.open({ appCode: "SS01", formData: JSON.stringify(formData) });
                                            //_taskStartModal.onClose(function () {
                                            //    location.reload();
                                            //});
                                            openSessionModal(session, session.id);
                                        }
                                    } else {
                                        var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
                                        LoadSessionStartBalance(now).done(function (startBalanceResult) {
                                            var formData = {
                                                message: "Start new session ?",
                                                receptionId: app.session.user.id,
                                                receptionName: app.session.user.name,
                                                receptionSurmame: app.session.user.surname,
                                                startDate: now, //moment(startingDate).format('MM/DD/YYYY'),
                                                workingDate: workingDateGlobal,
                                                startingBalance: startBalanceResult,
                                                lastSessionId: 0,
                                                endDate: now,
                                                endingCashBalance: 0,
                                                lastReceptionSummary: [
                                                    {
                                                        sessionId: 0,
                                                        startDate: now.format().toString(),
                                                        endDate: now.format().toString(),
                                                        workingDate: abp.timing.convertToUserTimezone(workingDateGlobal).format().toString(),
                                                        groupId: 0,
                                                        groupName: "",
                                                        subGroupId: 0,
                                                        subGroupName: "",
                                                        parameterId: 0,
                                                        parameterName: "",
                                                        roomCount: 0,
                                                        rooms: "",
                                                        amount: 0
                                                    }
                                                ]
                                            };
                                            _taskStartModal.open({ appCode: "SS01", formData: JSON.stringify(formData) });

                                            _taskStartModal.onClose(function () {
                                                location.reload();
                                            });
                                        });
                                    }
                                });
                            } else {
                                reservation.initCalendar(workingDateGlobal);
                            }
                        });

                    } else { abp.message.error("hotelpms_config гэсэн нөөц файл үүсгээд тохиргооны мэдээлэл оруулна уу"); }
                });
            },
            initCalendar: function (workingDateGlobal) {

                reservation.getServerRooms().done(function (roomTreeResult) {
                    // filter here ??
                    roomTree = roomTreeResult;
                    reservation.isHourlyView().done(function (isHourly) {
                        if (isHourly) { // hourly calendar                                    
                            reservation.getServerRoomBookingsHourly().done(function (bookings) {
                                reservation.renderHourlyCalendar(workingDateGlobal, roomTree, bookings);
                            });
                        } else { // normal calendar                                    
                            reservation.getServerRoomBookings().done(function (bookings) {
                                reservation.renderCalendar(workingDateGlobal, roomTree, bookings);
                                console.log(workingDateGlobal);
                            });
                        }
                    });
                });
            },
            renderCalendar: function (workingDate, roomTree, bookings) {
                // setting calendar height
                var height = $(window).height();
                $('#scheduler_here').height(height - 133);
                scheduler.plugins({ timeline: true, treetimeline: true, limit: true, collision: true, tooltip: true, minical: true });
                scheduler.locale.labels.timeline_tab = "Timeline";
                scheduler.config.details_on_create = true;
                scheduler.config.details_on_dblclick = true;
                scheduler.xy.scale_height = 20;
                scheduler.config.prevent_cache = true;
                scheduler.config.show_loading = true;
                scheduler.config.server_utc = false;
                scheduler.config.xml_date = "%Y-%m-%d";
                scheduler.config.collision_limit = 1;

                //scheduler.config.drag_move = false;

                scheduler.templates.timeline_scale_date = function (date) {
                    var func = scheduler.date.date_to_str(scheduler.matrix.timeline.x_date);
                    return func(date);
                };
                var miniCalendar = {
                    view: "minicalendar", click: function () {
                        if (scheduler.isCalendarVisible()) {
                            scheduler.destroyCalendar();
                        } else {
                            scheduler.renderCalendar({
                                position: this,
                                date: scheduler.getState().date,
                                navigation: true,
                                handler: function (date, calendar) { scheduler.setCurrentView(date); scheduler.destroyCalendar(); }
                            });
                        }
                    }
                };
                var newBooking = {
                    html: "<i class='menu-link-icon flaticon-time-3'></i> " + app.localize("New"), click: function () {
                        var formData = {
                            totalTax: parseInt(totalTax),
                            workingDate: abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day'),
                            status: 0,
                            modalOptions: { modalSize: 'xl' }
                        };
                        _taskStartModal.open({ appCode: "NB01", formData: JSON.stringify(formData) });
                    }
                };
                var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
                var newRoomBlock = {
                    html: "<i class='menu-link-icon flaticon-time-3'></i> " + app.localize("RoomBlock"), click: function () {
                        var formData = {
                            workingDate: abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day'),
                            status: 5,
                            startDate: abp.timing.convertToUserTimezone(now).startOf('day'),
                            endDate: abp.timing.convertToUserTimezone(now).add(1, 'days').endOf('day'),
                            userId: abp.session.userId,
                            userName: app.session.user.name,
                            currentDate: abp.timing.convertToUserTimezone(now).format(),
                            modalOptions: { modalSize: 'xl' }
                        };
                        _taskStartModal.open({ appCode: "NRB1", formData: JSON.stringify(formData) });
                    }
                };
                var searchBooking = {
                    html: "<i class='menu-link-icon flaticon-search' aria-hidden='true'></i> " + app.localize("Booking"), click: function () {
                        var formData = {
                            totalTax: parseInt(totalTax),
                            workingDate: workingDateGlobal,
                            modalOptions: { hideSaveButton: true, modalSize: 'xl', modalTitle: "Захиалгаас хайх" }
                        };
                        _taskStartModal.open({ appCode: "SB01", formData: JSON.stringify(formData) });
                    }
                };
                var nightAudit = {
                    html: "<i class='fa fa-moon-o'></i> " + app.localize("NightAudit"), click: function () {
                        abp.ui.block("#scheduler_here");
                        openNightAuditModal();
                        setTimeout(function () {
                            abp.ui.unblock("#scheduler_here");
                        }, 2000);
                    }
                };
                var hourlyOptions = {
                    html: "<i class='menu-link-icon flaticon2-chronometer' aria-hidden='true'></i> " + app.localize("Hourly"), click: function () {
                        localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_HOURLY, true);
                        location.reload();
                    }
                };

                scheduler.config.header = [];

                if (hotelConfig.filterBuilding && hotelConfig.filterBuilding === true) {
                    if (buildings.length > 0) {
                        var buildingSelect = "<select class='form-control form-select-sm selectBuilding' name='selectBuilding' id='selectBuilding'>";
                        var first = true;

                        $.each(buildings, function (index, building) {
                            if (selectedBuilding === null) {
                                selectedBuilding = building;
                                buildingSelect += "<option selected value='" + building + "'>" + building + "</option>";
                            } else {
                                buildingSelect += "<option value='" + building + "'>" + building + "</option>";
                            }
                        });

                        buildingSelect += "</select>";

                        var buildingOptions = {
                            html: buildingSelect, click: function () {
                                var selectedBuildingVal = $(".selectBuilding").val();
                                if (selectedBuilding !== selectedBuildingVal) {
                                    selectedBuilding = selectedBuildingVal;
                                    reservationAction.selectedBuildingChanged();
                                }
                            }
                        }

                        scheduler.config.header.push(buildingOptions);

                        if (hotelConfig.filterFloor && hotelConfig.filterFloor === true) {
                            floors = [];
                            $.each(roomTree, function (i, hRoom) {
                                if (hRoom.building === selectedBuilding) {
                                    if (hRoom.floor) {
                                        if ($.inArray(hRoom.floor, floors) === -1) {
                                            floors.push(hRoom.floor);
                                        }
                                    }
                                }
                            });

                            var floorSelect = "<select class='form-control selectFloor' name='selectFloor' id='selectFloor'>";

                            $.each(floors, function (j, hfFoor) {

                                if (selectedFloor === null) {
                                    selectedFloor = hfFoor;
                                    floorSelect += "<option selected value='" + hfFoor + "'>" + hfFoor + "</option>";
                                } else {
                                    floorSelect += "<option  value='" + hfFoor + "'>" + hfFoor + "</option>";
                                }
                            });

                            floorSelect += "</select>";

                            var floorOptions = {
                                html: floorSelect, click: function () {
                                    var selectedFloorVal = $(".selectFloor").val();
                                    if (selectedFloor !== selectedFloorVal) {
                                        selectedFloor = selectedFloorVal;
                                        reservation.renderServerRooms();
                                    }
                                }
                            }
                            scheduler.config.header.push(floorOptions);
                        }
                    }
                }

                scheduler.config.header.push(miniCalendar);
                scheduler.config.header.push("prev", app.localize("today"), "next", "date");

                scheduler.config.header.push(newBooking);
                scheduler.config.header.push(newRoomBlock);
                scheduler.config.header.push(searchBooking);

                scheduler.config.header.push(nightAudit);

                if (hotelConfig.enableHourly && hotelConfig.enableHourly === true) {
                    scheduler.config.header.push(hourlyOptions);
                }

                //===============
                //Configuration
                //===============
                scheduler.createTimelineView({
                    fit_events: true,
                    name: "timeline",
                    y_property: "room",
                    render: "tree",
                    x_unit: "day", // day
                    x_date: "%d",
                    x_size: 15, // 15 udur haruulna // eniig songoj boldog
                    dy: 28,  //(number) the minimum height of cell
                    folder_dy: 25, //(number) the height of folders in pixels
                    event_dy: 28,  //(number) the height of event
                    section_autoheight: false,
                    round_position: true,
                    y_unit: scheduler.serverList("sections"), //roomTree,
                    second_scale: { x_unit: "month", x_date: "%F %Y" },
                    x_start: 0,
                    cell_template: true
                });

                scheduler.templates.event_class = function (start, end, event) {
                    event.color = event.backgroundColorText;
                    event.textColor = event.colorText;
                    return "";
                };

                // cell and folder template
                scheduler.templates.timeline_cell_value = function (evs, date, section) {

                    // Summary columns
                    if (section.key === 1) {
                        var bookingCount = 0;
                        $.each(summaryBookings, function (index, booking) {
                            const d = new Date(abp.timing.convertToUserTimezone(date).startOf('day').add(1, 'days').format('YYYY-MM-DD'));
                            const start = new Date(abp.timing.convertToUserTimezone(booking.start_date).startOf('day').format('YYYY-MM-DD'));
                            const end = new Date(abp.timing.convertToUserTimezone(booking.end_date).startOf('day').format('YYYY-MM-DD'));
                            if (d > start && d <= end) { bookingCount = bookingCount + 1; }
                        });

                        return "<p class=\"text-primary\">" + bookingCount + "/" + totalRoomCount + "</p>"//; bookingCount + "/" + totalRoomCount;
                    }

                    if (section.children) {
                        var budgeStr = "";
                        if (folderBookings.length > 0) {
                            var unassignedBookingCount = 0;
                            $.each(folderBookings, function (index, booking) {
                                if (section.key === booking.roomTypeObj.id) {
                                    const d = new Date(abp.timing.convertToUserTimezone(date).startOf('day').add(1, 'days').format('YYYY-MM-DD'));
                                    const start = new Date(abp.timing.convertToUserTimezone(booking.start_date).startOf('day').format('YYYY-MM-DD'));
                                    const end = new Date(abp.timing.convertToUserTimezone(booking.end_date).startOf('day').format('YYYY-MM-DD'));
                                    if (d > start && d <= end) { unassignedBookingCount = unassignedBookingCount + 1; }
                                }
                            });
                            if (unassignedBookingCount != 0) {
                                budgeStr = "<span class='badge badge-square badge-warning'>" + unassignedBookingCount + "</span>";
                            }
                        }
                        if (hourlyBookings.length > 0) {
                            var hourlyBooking = 0;
                            $.each(hourlyBookings, function (index, hbooking) {
                                if (section.key === hbooking.roomTypeObj.id) {
                                    const d = new Date(abp.timing.convertToUserTimezone(date).startOf('day').add(1, 'days').format('YYYY-MM-DD'));
                                    const start = new Date(abp.timing.convertToUserTimezone(hbooking.start_date).startOf('day').format('YYYY-MM-DD'));
                                    const end = new Date(abp.timing.convertToUserTimezone(hbooking.end_date).endOf('day').add(1, 'days').format('YYYY-MM-DD'));

                                    if (d > start && d <= end) {
                                        hourlyBooking = hourlyBooking + 1;
                                    }
                                }
                            });
                            if (hourlyBooking != 0) {
                                budgeStr += "<span class='fs-4 fw-semibold text-gray-400 text-muted me-1 align-self-start' > <i class='fas fa-clock text-muted'></i> " + hourlyBooking + "</span>";
                            }
                        }
                        return budgeStr;
                    }

                    return "";
                };

                scheduler.attachEvent("onCellClick", function (x_ind, y_ind, x_val, y_val, e) {
                    let data = scheduler.getActionData(e);
                    let section = scheduler.getSection(data.section);
                    if (section.level === 0) {
                        if (folderBookings.length > 0) {
                            var folderBooking = [];
                            $.each(folderBookings, function (index, booking) {
                                if (section.key === booking.roomTypeObj.id) {
                                    const d = new Date(abp.timing.convertToUserTimezone(x_val).startOf('day').add(1, 'days').format('YYYY-MM-DD'));
                                    const start = new Date(abp.timing.convertToUserTimezone(booking.start_date).startOf('day').format('YYYY-MM-DD'));
                                    const end = new Date(abp.timing.convertToUserTimezone(booking.end_date).startOf('day').format('YYYY-MM-DD'));
                                    if (d > start && d <= end) { folderBooking.push(booking); }
                                }
                            });

                            if (folderBooking.length > 0) {
                                if (section.open === true) { scheduler.closeSection(section.key); } else { scheduler.openSection(section.key); }
                                var formData = {
                                    bookedRoomId: folderBooking[0].id, // booked room id
                                    arrival: abp.timing.convertToUserTimezone(folderBooking[0].start_date).startOf('day'),
                                    departure: abp.timing.convertToUserTimezone(folderBooking[0].end_date).startOf('day'),
                                    roomType: folderBooking[0].roomTypeObj,
                                    room: folderBooking[0].roomObj,
                                    status: folderBooking[0].status,
                                    bookingId: folderBooking[0].booking_id,
                                    text: folderBooking[0].text
                                };
                                _taskStartModal.open({
                                    appCode: "RA01",
                                    formData: JSON.stringify(formData)
                                });
                            }
                        }
                    }
                });

                // uruunii nernii template
                scheduler.templates.timeline_scale_label = function (key, label, section) {

                    if (section.$parent == null)
                        return section.label;

                    if (section.roomStatus == 2) {
                        return ["<div id='ghasdhdsakdjk'>" + section.label + " <a href='#'><span class='glowing'><i class='la-broom'></i> </span></a> </div>",
                        "<span class='room_status_indicator room_status_indicator_" + section.roomStatus + "' ></span > ",
                        ].join("");
                        /* return ["<div id='ghasdhdsakdjk'>" + section.label + " <a href='#'><span class='glowing'><i class='la-broom'></i> Цэвэрлэх</span></a> </div>",
                         "<span class='room_status_indicator room_status_indicator_" + section.roomStatus + "' ></span > ",
                         ].join(""); */
                    } // Cleaning
                    else if (section.roomStatus == 3) {
                        return ["<div>" + section.label + " <span class='glowing'>Cleaning</span></div>",
                        "<span class='room_status_indicator room_status_indicator_" + section.roomStatus + "' ></span > ",
                        ].join("");
                    }
                    else {
                        return ["<div>" + section.label + "</div>",
                        "<span class='room_status_indicator room_status_indicator_" + section.roomStatus + "' ></span > ",
                        ].join("");
                    }
                };

                // Event name on cell
                scheduler.templates.event_bar_text = function (start, end, event) {
                    var groupColor = event.groupColor;

                    if (groupColor && groupColor.length != 0) {
                        return " <i class=\"fa fa-users\" style=\"color:" + groupColor + ";\"></i> " + event.text;
                    } else {
                        return event.text;
                    }
                };

                var format = scheduler.date.date_to_str("%Y-%m-%d");
                var formatHour = scheduler.date.date_to_str("%H:%i");

                scheduler.templates.tooltip_text = function (start, end, event) {

                    var stat = parseInt(event.status), statText = "";

                    switch (stat) {
                        //case 0: statText = "Unconfirmed booking"; break;
                        case 1: statText = app.localize("Arrived"); break;
                        case 2: statText = app.localize("CheckedOu"); break;
                        case 3: statText = app.localize("DueOut"); break;
                        case 4: statText = app.localize("ConfirmedReservation"); break;
                        case 5: statText = app.localize("MaintenanceBlock"); break;
                        case 6: statText = app.localize("StayOver"); break;
                        case 7: return event.text + "<br/><b>" + app.localize("StartHour") + ":</b> " +
                            formatHour(start) + "<br/><b>" + app.localize("EndHour") + ":</b> " + formatHour(end) + "<br/><b>" + app.localize("DayuseReservation") + "</b>";
                        case 8: return event.text + "<br/><b>" + app.localize("StartHour") + ":</b> " +
                            formatHour(start) + "<br/><b>" + app.localize("EndHour") + ":</b> " + formatHour(end) + "<br/><b>" + app.localize("Dayuse") + "</b>";
                        // 9  bol hourly checkout shudee.
                    }
                    var adult = 0, child = 0;
                    if (event.adult) { adult = event.adult; }
                    if (event.child) { child = event.child; }
                    return event.text + "<br/><b>" + app.localize("StartDate") + ":</b> " +
                        format(start) + "<br/><b>" + app.localize("EndDate") + ":</b> " + format(end) + "<br/>" +
                        "<b>" + statText + "</b>" +
                        "<br/><i class=\"fa fa-male\"> " + adult + " </i> " +
                        "<i class=\"fa fa-child\"> " + child + " </i> ";
                };

                // next prev button step
                scheduler.date.add_timeline = function (date, step) {
                    //var size = scheduler.matrix["timeline"].x_size;
                    console.log(scheduler);
                    console.log(date);
                    var size = 1;
                    return scheduler.date.add(date, step * size, "day");
                };

                scheduler.attachEvent("onEventCollision", function (ev, evs) {
                    for (var i = 0; i < evs.length; i++) {
                        if (ev.room != evs[i].room) continue;
                        abp.notify.error('This room is already booked for this date.', 'Room booking error');
                    }
                    return true;
                });

                scheduler.attachEvent("onBeforeTodayDisplayed", function () {
                    scheduler.setCurrentView(abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day').add(-1, 'days'));
                    return false;
                });

                // override and left body empty
                scheduler.showLightbox = function (id) {
                    return true;
                };

                var beforeEvent;
                var dragEvent_Room = null;
                var dragEvent_StartDate = null;
                var dragEvent_EndDate = null;
                var dragHorizontal = null; // hevtee
                var dragVertical = null; // bosoo

                scheduler.attachEvent("onBeforeDrag", function (id, mode, e) {
                    // use it to get the object of the dragged event
                    var dragged_event = scheduler.getEvent(id);
                    if (dragged_event) {
                        beforeEvent = {
                            room: dragged_event.room,
                            start_date: dragged_event.start_date,
                            end_date: dragged_event.end_date
                        };
                    } else {
                        beforeEvent = null;
                    }
                    return true;
                });

                scheduler.attachEvent("onBeforeEventChanged", function (ev, e, is_new, original) {
                    if (scheduler.getState().mode == "timeline" && !is_new) {
                        if (dragVertical === true && dragHorizontal == true) {
                            if (ev.room === original.room) {
                                if (original.start_date.getTime() <= new Date(workingDateGlobal).getTime()) {
                                    ev.start_date = original.start_date;
                                }
                            } else {
                                ev.start_date = original.start_date;
                                ev.end_date = original.end_date;
                            }
                        } else {
                            if (dragVertical === true) {
                                ev.start_date = original.start_date;
                                ev.end_date = original.end_date;
                            } else if (dragHorizontal === true) {
                                if (original.start_date.getTime() <= new Date(workingDateGlobal).getTime()) {
                                    ev.start_date = original.start_date;
                                }
                            }
                        }
                    }
                    return true;
                });

                scheduler.attachEvent("onEventDrag", function (id, mode, e) {

                    //mode: move, resize, new-size
                    if (mode === "move") {
                        var moving_event = scheduler.getEvent(id);

                        if (moving_event) {

                            if (dragEvent_Room === null) { dragEvent_Room = moving_event.room; }
                            if (dragEvent_StartDate === null) { dragEvent_StartDate = moving_event.start_date; }
                            if (dragEvent_EndDate === null) { dragEvent_EndDate = moving_event.end_date; }

                            if (dragHorizontal === null || dragVertical === null) {

                                if (dragEvent_Room !== moving_event.room) {
                                    dragVertical = true;
                                }

                                if (dragEvent_StartDate.getTime() != moving_event.start_date.getTime() || dragEvent_EndDate.getTime() != moving_event.end_date.getTime()) {
                                    dragHorizontal = true;
                                }
                            }
                        }
                    }
                    return true;
                });

                scheduler.attachEvent("onDragEnd", function (id, mode, e) {
                    dragEvent_Room = null;
                    dragEvent_StartDate = null;
                    dragEvent_EndDate = null;
                    dragHorizontal = null;
                    dragVertical = null;

                    abp.ui.block("#scheduler_here");
                    var event = scheduler.getEvent(id);

                    reservationAction.showEventModal(event, beforeEvent);
                    setTimeout(function () {
                        abp.ui.unblock("#scheduler_here");
                    }, 1000);
                });

                scheduler.attachEvent("onYScaleClick", function (index, section, e) {
                    if (section.roomStatus == 2) {
                        var roomId = section.key;
                        reservationAction.showCleanModal(roomId);
                    }
                });

                // Working date style
                scheduler.addMarkedTimespan({ days: new Date(workingDate), zones: "fullday", css: "working_date" });

                // weekend style
                scheduler.addMarkedTimespan({ days: [0, 6], zones: "fullday", css: "timeline_weekend" });

                //$('#scheduler_here').empty();
                scheduler.init('scheduler_here', workingDate, "timeline");

                reservation.renderServerRooms();

                scheduler.parse(bookings);

                scheduler.setCurrentView(abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day').add(-1, 'days'));
            },
            renderServerRooms: function () {
                if (hotelConfig.filterBuilding === true) {
                    //var selectBuildingVal = $(".selectBuilding").val();// end irj bn
                    //var selectFloorVal = $(".selectFloor").val();
                    if (selectedBuilding) {
                        var roomTreeRender = [];
                        $.each(roomTree, function (ind, roomT) {
                            if (hotelConfig.filterFloor === true) {
                                if (roomT.building === selectedBuilding && roomT.floor === selectedFloor) {
                                    roomTreeRender.push(roomT);
                                }
                            } else {
                                if (roomT.building === selectedBuilding) {

                                    roomTreeRender.push(roomT);
                                }
                            }
                        });
                        scheduler.updateCollection("sections", roomTreeRender);
                    } else {
                        scheduler.updateCollection("sections", roomTree);
                    }
                } else {
                    scheduler.updateCollection("sections", roomTree);
                }
                if (selectedBuilding) {
                    $('#selectBuilding').val(selectedBuilding);
                }

                if (selectedFloor) {
                    $('#selectFloor').val(selectedFloor);
                }
            },
            renderHourlyCalendar: function (workingDate, roomTree, bookings) {
                var height = $(window).height();
                $('#scheduler_here').height(height - 133);
                scheduler.plugins({
                    timeline: true, treetimeline: true, limit: true,
                    daytimeline: true,
                    collision: true, tooltip: true, minical: true
                });
                scheduler.locale.labels.timeline_tab = "Timeline";
                scheduler.config.details_on_create = true;
                scheduler.config.details_on_dblclick = true;
                scheduler.xy.scale_height = 20;
                scheduler.config.prevent_cache = true;
                scheduler.config.show_loading = true;
                scheduler.config.server_utc = false;
                scheduler.config.xml_date = "%Y-%m-%d";
                scheduler.config.collision_limit = 1;
                scheduler.templates.timeline_scale_date = function (date) {
                    var func = scheduler.date.date_to_str(scheduler.matrix.timeline.x_date);
                    return func(date);
                };

                scheduler.config.header = [
                    {
                        view: "minicalendar", click: function () {
                            if (scheduler.isCalendarVisible()) {
                                scheduler.destroyCalendar();
                            } else {
                                scheduler.renderCalendar({
                                    position: this,
                                    date: scheduler.getState().date,
                                    navigation: true,
                                    handler: function (date, calendar) { scheduler.setCurrentView(date); scheduler.destroyCalendar(); }
                                });
                            }
                        }
                    },
                    "prev", app.localize("today"), "next", "date",
                    {
                        html: "<i class='flaticon2-contrast'></i> " + app.localize("NightAudit"), click: function () {
                            abp.ui.block("#scheduler_here");
                            openNightAuditModal();
                            setTimeout(function () {
                                abp.ui.unblock("#scheduler_here");
                            }, 2000);
                        }
                    },
                    {
                        html: "<i class='flaticon-calendar-with-a-clock-time-tools'></i> " + app.localize("TimelineCalendar"), click: function () {
                            localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_HOURLY, false);
                            //location.reload();
                            reservation.init();
                        }
                    }
                ];

                scheduler.createTimelineView({
                    fit_events: true,
                    name: "timeline",
                    y_property: "room",
                    render: "tree",
                    x_unit: "minute", // day
                    x_date: "%H",//"%H:%i",
                    x_step: 60, // x step is 60 min
                    x_size: 24, // 15 udur haruulna // eniig songoj boldog
                    x_length: 24,
                    x_start: 0, // 16 gevel ugluunii 8 tsag 2*8=16
                    section_autoheight: false,
                    round_position: true,
                    y_unit: roomTree,
                    second_scale: {
                        x_unit: "day",
                        x_date: "%d %M"
                    },

                    dy: 28,  //(number) the minimum height of cell
                    folder_dy: 25, //(number) the height of folders in pixels
                    event_dy: 28,  //(number) the height of event
                    //folder_dy: 30,
                    //x_step: 0,// day bol 1eer (24 tsagaar haruulna)
                    cell_template: true
                    //dy: 60,                    
                });

                scheduler.templates.timeline_cell_value = function (evs, date, section) {
                    return "";
                }

                scheduler.templates.event_class = function (start, end, event) {
                    var status = event.status;
                    return "event_" + (status || "");
                };

                scheduler.attachEvent("onXLE", function () {
                    console.log('---------------onXle event:');
                });

                scheduler.attachEvent("onBeforeTodayDisplayed", function () {
                    scheduler.setCurrentView(abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day'));
                    return false;
                });

                scheduler.showLightbox = function (id) {
                    return true;
                };

                scheduler.attachEvent("onYScaleClick", function (index, section, e) {
                    if (section.roomStatus == 2) {
                        var roomId = key;
                        reservationAction.showCleanModal(roomId);
                    }
                });

                var hourlyBeforeEvent;

                scheduler.attachEvent("onBeforeDrag", function (id, mode, e) {
                    // use it to get the object of the dragged event
                    var dragged_event = scheduler.getEvent(id);
                    if (dragged_event) {
                        hourlyBeforeEvent = {
                            room: dragged_event.room,
                            start_date: dragged_event.start_date,
                            end_date: dragged_event.end_date
                        };
                    } else {
                        hourlyBeforeEvent = null;
                    }
                    return true;
                });

                scheduler.attachEvent("onDragEnd", function (id, mode, e) {
                    var event = scheduler.getEvent(id);
                    reservationAction.showHourlyModal(event, hourlyBeforeEvent);
                });

                scheduler.init('scheduler_here', workingDate, "timeline");
                scheduler.parse(bookings);
            },
            getTotalTax() {
                if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX)) {
                    _dynamicEntityManager.getResourcesByKey('hotelpms_tax').done(function (taxes) {
                        var totalTax = 0;
                        $.each(taxes, function (index, tax) {
                            var taxDoc = JSON.parse(tax.document);
                            if (taxDoc.rate) { totalTax = totalTax + taxDoc.rate; }
                        });
                        localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX, totalTax);
                        return totalTax;
                    });
                } else {
                    return localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX);
                }
            },
            isHourlyView() {
                var isHourly = $.Deferred();
                if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_HOURLY)) {
                    isHourly.resolve(false);
                } else {
                    var isTrueSet = (localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_HOURLY) === 'true');
                    isHourly.resolve(isTrueSet);
                }
                return isHourly.promise();
            },
            getServerRooms: function () {
                var roomTree = $.Deferred(), roomT = [{
                    "key": 1,
                    "label": app.localize("Summary"),
                    "children": [],
                    "level": 0,
                    "$parent": null
                }];

                reservation.getRoomTypes().done(function (roomTypesResult) {
                    var roomTypes = JSON.parse(roomTypesResult);
                    reservation.getRooms().done(function (roomResult) {
                        var rooms = JSON.parse(roomResult);
                        $.each(roomTypes.items, function (rtIndex, roomType) {
                            var roomTypeObj = JSON.parse(roomType.document), children = [];
                            totalRoomCount = rooms.items.length;
                            $.each(rooms.items, function (rIndex, room) {
                                roomObj = JSON.parse(room.document);

                                if (roomObj.type_id == roomType.id) {
                                    children.push({ key: room.id, label: roomObj.name, roomStatus: roomObj.status });
                                }
                            });

                            if (roomTypeObj.building) {
                                if ($.inArray(roomTypeObj.building, buildings) === -1) {
                                    buildings.push(roomTypeObj.building);
                                }
                            }
                            if (roomTypeObj.floor) {
                                if ($.inArray(roomTypeObj.floor, floors) === -1) {
                                    floors.push(roomTypeObj.floor);
                                }
                            }

                            roomT.push({ key: roomType.id, label: roomTypeObj.name, building: roomTypeObj.building, floor: roomTypeObj.floor, open: true, children: children });
                        });

                        roomTree.resolve(roomT);
                    });
                });

                return roomTree.promise();
            },
            getHotelConfig() {
                var config = $.Deferred();
                //localStorage.removeItem("hotelpms_config");
                if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG)) {
                    _dynamicEntityManager.getResourcesByKey('hotelpms_config').done(function (configResult) {
                        if (configResult) {
                            if (configResult.length > 0) {
                                var configParsed = JSON.parse(configResult[0].document);
                                configParsed.id = configResult[0].id;
                                var jString = JSON.stringify(configParsed);
                                config.resolve(jString);
                                localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG, jString);
                            } else {
                                abp.message.error("hotelpms_config нөөц дээр Тохиргооны мэдээлэл оруулна уу");
                            }
                        } else {
                            abp.message.error("hotelpms_config нөөц дээр Тохиргооны мэдээлэл оруулна уу");
                        }
                    });
                } else {
                    config.resolve(localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG));
                }
                return config.promise();
            },
            getRoomTypes() {
                var roomTypes = $.Deferred();
                if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE)) {
                    var loadOptions = { filter: '', sort: '[{ "selector": "sortOrder", "desc": false }]' };
                    _dynamicEntityManager.getResourcesByKeyFilter('hotelpms_roomType', loadOptions).done(function (roomTypesResult) {
                        var json = JSON.stringify(roomTypesResult);
                        roomTypes.resolve(json);
                        localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE, json)
                    });
                } else {
                    roomTypes.resolve(localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE));
                }
                return roomTypes.promise();
            },
            getRooms() {
                var rooms = $.Deferred();
                if (!localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM)) {
                    var loadOptions = { filter: '', sort: '[{ "selector": "sortOrder", "desc": false }]' };
                    _dynamicEntityManager.getResourcesByKeyFilter('hotelpms_room', loadOptions).done(function (roomResult) {
                        var json = JSON.stringify(roomResult);
                        rooms.resolve(json);
                        localStorage.setItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM, json)
                    });
                } else {
                    rooms.resolve(localStorage.getItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM));
                }
                return rooms.promise();
            },
            getServerRoomBookings: function () {
                var booking = $.Deferred(), bookingArray = [];
                // TODO: add datetime filter here
                _dynamicEntityManager.getResourcesByKey('hotelpms_bookedRooms').done(function (bookedRooms) {
                    _dynamicEntityManager.getResourcesByKey('hotelpms_color').done(function (colors) {
                        folderBookings = []; hourlyBookings = []; summaryBookings = [];
                        $.each(bookedRooms, function (index, bookedRoom) {
                            var bookedRoomObj = JSON.parse(bookedRoom.document);
                            var room = null;
                            if (bookedRoomObj.room) { if (bookedRoomObj.room.id) { room = bookedRoomObj.room.id; } }
                            var text = bookedRoomObj.description;
                            if (!text) { if (bookedRoomObj.booking) { text = bookedRoomObj.booking.id; } }
                            var bookingStatus = 0; if (bookedRoomObj.status) { bookingStatus = bookedRoomObj.status; }

                            const startDate = abp.timing.convertToUserTimezone(bookedRoomObj.startDate).startOf('day');//.add(1, 'days') // just to Adjust on calendar
                            const endDate = abp.timing.convertToUserTimezone(bookedRoomObj.endDate).startOf('day');

                            if (bookedRoomObj.booking != undefined) {
                                if (room) {
                                    // You can add custom properties here
                                    if (bookingStatus != 0 && bookingStatus != 9) {

                                        var status = bookingStatus;
                                        var findcolor = undefined;

                                        if (bookingStatus == 7 || bookingStatus == 8) {
                                            const startDateHour = abp.timing.convertToUserTimezone(bookedRoomObj.startDate).startOf('hour');
                                            const endDateHour = abp.timing.convertToUserTimezone(bookedRoomObj.endDate).startOf('hour');

                                            bookingArray.push({
                                                id: bookedRoom.id, //bookedRoomObj.booking.id, 
                                                refId: bookedRoomObj.refId,
                                                start_date: startDateHour,
                                                end_date: endDateHour,
                                                booking_id: bookedRoomObj.booking.id,
                                                room: room,
                                                roomObj: bookedRoomObj.room,
                                                roomTypeObj: bookedRoomObj.roomType,
                                                rateType: bookedRoomObj.rateType,
                                                text: text,
                                                status: bookingStatus,
                                                groupColor: bookedRoomObj.groupColor
                                            });

                                            hourlyBookings.push({
                                                id: bookedRoom.id, //bookedRoomObj.booking.id, 
                                                refId: bookedRoomObj.refId,
                                                booking_id: bookedRoomObj.booking.id,
                                                start_date: abp.timing.convertToUserTimezone(bookedRoomObj.startDate).startOf('hour'),
                                                end_date: abp.timing.convertToUserTimezone(bookedRoomObj.endDate).startOf('hour'),
                                                room: room,
                                                roomObj: bookedRoomObj.room,
                                                roomTypeObj: bookedRoomObj.roomType,
                                                text: text,
                                                status: bookingStatus
                                            });
                                        } else {
                                            var adult = bookedRoomObj.adult, child = bookedRoomObj.child;

                                            if (typeof child === 'object') { child = 0; }
                                            if (typeof adult === 'object') { adult = 0; }

                                            bookingArray.push({
                                                id: bookedRoom.id, //bookedRoomObj.booking.id, 
                                                refId: bookedRoomObj.refId,
                                                start_date: startDate,
                                                end_date: endDate,
                                                booking_id: bookedRoomObj.booking.id,
                                                room: room,
                                                roomObj: bookedRoomObj.room,
                                                roomTypeObj: bookedRoomObj.roomType,
                                                rateType: bookedRoomObj.rateType,
                                                text: text,
                                                status: bookingStatus,
                                                adult: adult,
                                                child: child,
                                                groupColor: bookedRoomObj.groupColor
                                            });

                                            summaryBookings.push({
                                                id: bookedRoom.id, //bookedRoomObj.booking.id, 
                                                start_date: startDate,
                                                end_date: endDate,
                                                booking_id: bookedRoomObj.booking.id,
                                                room: room,
                                                roomObj: bookedRoomObj.room,
                                                roomTypeObj: bookedRoomObj.roomType,
                                                rateType: bookedRoomObj.rateType,
                                                text: text,
                                                status: bookingStatus,
                                                adult: adult,
                                                child: child,
                                                groupColor: bookedRoomObj.groupColor
                                            });
                                        }

                                        $.each(colors, function (Index, color) {
                                            var colorStatus = JSON.parse(color.document);
                                            if (status == colorStatus.statusValue) {
                                                findcolor = 1;
                                                bookingArray[bookingArray.length - 1].colorText = colorStatus.textColor;
                                                bookingArray[bookingArray.length - 1].backgroundColorText = colorStatus.backGroundColor;
                                                //console.log("colors", colorText, backgroundColorText);
                                            }
                                        })

                                        if (bookingArray[bookingArray.length - 1].backgroundColorText === undefined || bookingArray[bookingArray.length - 1].backgroundColorText === "") {
                                            backgroundColorText = '#FFFFFF';
                                        }

                                        if (findcolor == undefined) {
                                            switch (status) {
                                                case '1':
                                                    colorText = '#578EBE';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '2':
                                                    colorText = '#32085e';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '3':
                                                    colorText = '#E43A45';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '4':
                                                    colorText = '#1BA39C';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '5':
                                                    colorText = '#F3C200';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '6':
                                                    colorText = '#2C3E50';
                                                    backgroundColorText = '#f0f0f0';
                                                    break;
                                                case '7':
                                                    colorText = '#8775A7';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '8':
                                                    colorText = 'Day Use';
                                                    backgroundColorText = '#8E44AD';
                                                    break;
                                                default:
                                                    colorText = '#000000';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                            }
                                        }
                                    } else {
                                        folderBookings.push({
                                            id: bookedRoom.id,
                                            refId: bookedRoomObj.refId,
                                            start_date: startDate,
                                            end_date: endDate,
                                            booking_id: bookedRoomObj.booking.id,
                                            room: room,
                                            roomObj: bookedRoomObj.room,
                                            roomTypeObj: bookedRoomObj.roomType,
                                            text: text,
                                            status: bookingStatus
                                        });
                                    }
                                }
                                else {
                                    folderBookings.push({
                                        id: bookedRoom.id,
                                        refId: bookedRoomObj.refId,
                                        start_date: startDate,
                                        end_date: endDate,
                                        booking_id: bookedRoomObj.booking.id,
                                        roomObj: bookedRoomObj.room,
                                        roomTypeObj: bookedRoomObj.roomType,
                                        text: text,
                                        status: bookingStatus
                                    });
                                }
                            }
                        })

                        booking.resolve(bookingArray);
                    })
                });
                return booking.promise();
            },
            getServerRoomBookingsHourly: function () {
                var booking = $.Deferred(), bookingArray = [];
                _dynamicEntityManager.getResourcesByKey('hotelpms_bookedRooms').done(function (bookedRooms) {
                    _dynamicEntityManager.getResourcesByKey('hotelpms_color').done(function (colors) {
                        folderBookings = [];
                        $.each(bookedRooms, function (index, bookedRoom) {
                            var bookedRoomObj = JSON.parse(bookedRoom.document);
                            var room = null;
                            var status = bookingStatus;
                            var findcolor = undefined;
                            if (bookedRoomObj.room) { if (bookedRoomObj.room.id) { room = bookedRoomObj.room.id; } }
                            var text = bookedRoomObj.description;
                            if (!text) { if (bookedRoomObj.booking) { text = bookedRoomObj.booking.id; } }

                            var startDate = abp.timing.convertToUserTimezone(bookedRoomObj.startDate).startOf('day').add(13, 'hour');
                            var endDate = abp.timing.convertToUserTimezone(bookedRoomObj.endDate).startOf('day').add(12, 'hour');

                            var bookingStatus = 0;
                            if (bookedRoomObj.status) {

                                bookingStatus = bookedRoomObj.status;

                                if (bookingStatus == 7 || bookingStatus == 8 || bookingStatus == 9) {
                                    startDate = abp.timing.convertToUserTimezone(bookedRoomObj.startDate).startOf('hour');
                                    endDate = abp.timing.convertToUserTimezone(bookedRoomObj.endDate).endOf('hour');
                                }
                            }
                            if (bookedRoomObj.booking != undefined) {
                                if (room) {
                                    // You can add custom properties here
                                    if (bookingStatus != 0) {
                                        bookingArray.push({
                                            id: bookedRoom.id,
                                            refId: bookedRoomObj.refId,
                                            start_date: startDate,
                                            end_date: endDate,
                                            booking_id: bookedRoomObj.booking.id,
                                            room: room,
                                            roomObj: bookedRoomObj.room,
                                            roomTypeObj: bookedRoomObj.roomType,
                                            rateType: bookedRoomObj.rateType,
                                            text: text,
                                            status: bookingStatus,
                                            adult: bookedRoomObj.adult,
                                            child: bookedRoomObj.child,
                                            groupColor: bookedRoomObj.groupColor
                                        });

                                        $.each(colors, function (Index, color) {
                                            var colorStatus = JSON.parse(color.document);
                                            if (status == colorStatus.statusValue) {
                                                findcolor = 1;
                                                bookingArray[bookingArray.length - 1].colorText = colorStatus.textColor;
                                                bookingArray[bookingArray.length - 1].backgroundColorText = colorStatus.backGroundColor;
                                                //console.log("colors", colorText, backgroundColorText);
                                            }
                                        })

                                        if (bookingArray[bookingArray.length - 1].backgroundColorText === undefined || bookingArray[bookingArray.length - 1].backgroundColorText === "") {
                                            backgroundColorText = '#FFFFFF';
                                        }

                                        if (findcolor == undefined) {
                                            switch (status) {
                                                case '1':
                                                    colorText = '#578EBE';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '2':
                                                    colorText = '#32085e';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '3':
                                                    colorText = '#E43A45';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '4':
                                                    colorText = '#1BA39C';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '5':
                                                    colorText = '#F3C200';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '6':
                                                    colorText = '#2C3E50';
                                                    backgroundColorText = '#f0f0f0';
                                                    break;
                                                case '7':
                                                    colorText = '#8775A7';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                                case '8':
                                                    colorText = 'Day Use';
                                                    backgroundColorText = '#8E44AD';
                                                    break;
                                                default:
                                                    colorText = '#000000';
                                                    backgroundColorText = '#FFFFFF';
                                                    break;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        booking.resolve(bookingArray);
                    })
                });
                return booking.promise();
            }
        }

        var reservationAction = {
            showEventModal: function (event, beforeEvent) {
                var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
                var nowDate = abp.timing.convertToUserTimezone(now);
                var startDate = abp.timing.convertToUserTimezone(event.start_date).startOf('day');
                var endDate = abp.timing.convertToUserTimezone(event.end_date).endOf('day');
                var workingDate = abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day');

                var status = event.status;
                var startDaysToWorkingDays = workingDate.startOf('day').diff(startDate.startOf('day'), 'days', false);

                if (startDaysToWorkingDays == 0) { // Means start days same as working days, more chance to walk in                    
                    status = 1;
                } else { status = 4; }

                if (beforeEvent == null) { // NEW BOOKING : beforeEvent null means new event
                    if (startDaysToWorkingDays <= 0) {
                        onNewBooking({ event: event, startDate: startDate, endDate: endDate, workingDate: workingDate, totalTax: totalTax, status: status });
                    } else {
                        abp.message.error("Та өнгөрсөнд захиалга авж болохгүй");
                        scheduler.deleteEvent(event.id);
                    }
                }
                else { // UPDATE BOOKING
                    var beforeStartDate = abp.timing.convertToUserTimezone(beforeEvent.start_date).startOf('day');
                    var beforeEndDate = abp.timing.convertToUserTimezone(beforeEvent.end_date).startOf('day');

                    //var beforeTotalDays = beforeEndDate.startOf('day').diff(beforeStartDate.startOf('day'), 'days', false) + 1; // TODO Check
                    var beforeTotalDays = beforeEndDate.startOf('day').diff(beforeStartDate.startOf('day'), 'days', false);

                    if (event.room == beforeEvent.room) { // same room

                        var startChangedDays = beforeStartDate.startOf('day').diff(startDate.startOf('day'), 'days', false);
                        var endChangedDays = endDate.startOf('day').diff(beforeEndDate.startOf('day'), 'days', false);

                        if (endChangedDays === 0 && startChangedDays == 0) { // UB01                                    
                            openBookingDetail({
                                workingDate: workingDate,
                                event: event,
                                endDate: endDate,
                                beforeTotalDays: beforeTotalDays
                            });
                        } else { // AS01
                            if (endDate < workingDate) {
                                abp.message.error("Та өнгөрчнийг өөрчилж болохгүй");
                                reloadNormaCalendar();
                            } else {
                                onAmendStay({
                                    event: event, beforeEvent: beforeEvent,
                                    endChangedDays: endChangedDays, startChangedDays: startChangedDays,
                                    startDate: startDate, endDate: endDate,
                                    beforeEndDate: beforeEndDate, beforeStartDate: beforeStartDate
                                });
                            }
                        }
                    } else { // Room move process
                        if (endDate < workingDate) {
                            abp.message.error("Та өнгөрчнийг өөрчилж болохгүй");
                            reloadNormaCalendar();
                        } else {
                            var pastEvent = "false";
                            _dynamicEntityManager.getResourceById(event.room).done(function (targetRoom) {
                                var targetRoomData = JSON.parse(targetRoom.document);
                                var targetRoomObj = { id: targetRoom.id, data: targetRoomData };

                                if (event.roomTypeObj.id === targetRoomData.type_id) {
                                    if (startDate < workingDate) {
                                        pastEvent = "true";
                                        // get current booked room information
                                        _dynamicEntityManager.getResourceById(event.id).done(function (currentBookeRoom) {
                                            var currentBookedRoomData = JSON.parse(currentBookeRoom.document);
                                            let newStartDate = workingDate;
                                            let newEndDate = workingDate;

                                            var roomMoveFormData = {
                                                id: event.id,
                                                bookingId: event.booking_id,
                                                refId: event.refId,
                                                newStartDate: newStartDate.startOf('day'), //newStartDate.startOf('day').add(1, 'day'),
                                                newEndDate: endDate,//newEndDate.endOf('day').add('-1', 'd'),
                                                endDate: newEndDate.endOf('day'),
                                                newDescription: currentBookedRoomData.description,
                                                newAdult: currentBookedRoomData.adult,
                                                newChild: currentBookedRoomData.child,
                                                newGroupColor: currentBookedRoomData.groupColor,
                                                newRateType: currentBookedRoomData.rateType,
                                                pastEvent: pastEvent,
                                                room: targetRoomObj,
                                                roomType: event.roomTypeObj,
                                                currentRoom: event.roomObj,
                                                arrival: startDate,
                                                departure: endDate,
                                                status: event.status,
                                                totalNights: beforeTotalDays,
                                                deposit: 0
                                            };

                                            onRoomMove(roomMoveFormData); // RM01
                                        });
                                    } else {
                                        var roomMoveFormData = {
                                            id: event.id,
                                            refId: event.refId,
                                            room: targetRoomObj,
                                            roomType: event.roomTypeObj,
                                            currentRoom: event.roomObj,
                                            arrival: startDate,
                                            departure: endDate,
                                            status: event.status,
                                            totalNights: beforeTotalDays,
                                            bookingId: event.booking_id,
                                            pastEvent: pastEvent,
                                            deposit: 0
                                        };

                                        onRoomMove(roomMoveFormData); // RM01
                                    }
                                } else {
                                    onRoomMoveAndChangeRate({ // ROM02
                                        event: event,
                                        targetRoomObj: targetRoomObj,
                                        beforeEvent: beforeEvent,
                                        beforeTotalDays: beforeTotalDays
                                    });
                                }
                            });
                        }
                    }
                }
            },
            showHourlyModal: function (event, beforeEvent) {
                var startDate = abp.timing.convertToUserTimezone(event.start_date).startOf('hour');
                var departure = abp.timing.convertToUserTimezone(event.end_date).startOf('hour');
                var workingDate = abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day');
                var status = event.status;

                if (beforeEvent == null) { //create new hourly event
                    _dynamicEntityManager.getResourceById(event.room).done(function (roomResult) {
                        var room = { id: event.room, data: JSON.parse(roomResult.document) };
                        _dynamicEntityManager.getResourceById(room.data.type_id).done(function (roomTypeResult) {
                            var roomType = { id: roomTypeResult.id, data: JSON.parse(roomTypeResult.document) }
                            var formData = {
                                arrival: startDate, //moment(startingDate).format('MM/DD/YYYY'),
                                departure: departure, //moment(departureDate).format('MM/DD/YYYY'),
                                room: room,
                                roomType: roomType,
                                status: status,
                                totalTax: parseInt(totalTax),
                                workingDate: workingDate,
                                modalOptions: { modalSize: 'xl' }
                            };
                            _taskStartModal.open({ appCode: "NBH1", formData: JSON.stringify(formData) });
                        });
                    });

                } else {
                    // TODO: Check other actions
                    var bookingId = event.booking_id; //event.id;

                    var remainDays = departure.startOf('day').diff(workingDate.startOf('day'), 'days', false);

                    var beforeStartDate = abp.timing.convertToUserTimezone(beforeEvent.start_date).startOf('day');

                    var beforeEndDate = abp.timing.convertToUserTimezone(beforeEvent.end_date).startOf('day');

                    var beforeTotalDays = beforeEndDate.startOf('day').diff(beforeStartDate.startOf('day'), 'days', false);

                    var startArrival = event.start_date; // abp.timing.convertToUserTimezone(event.start_date).format("DD-MMM-YYYY hh:mm");
                    var endDeparture = event.end_date; // abp.timing.convertToUserTimezone(event.end_date).format("DD-MMM-YYYY hh:mm");

                    var duration = beforeTotalDays + " " + app.localize("Nights");

                    if (beforeTotalDays === 1) {
                        duration = "1 night";
                    } else {
                        if (beforeTotalDays === 0) {
                            var duration = moment.duration(abp.timing.convertToUserTimezone(event.end_date).diff(abp.timing.convertToUserTimezone(event.start_date)));
                            duration = duration.asHours().toFixed(0) + " hour";
                        }
                    }

                    var formData = {
                        id: event.id,
                        remainDays: remainDays,
                        workingDate: workingDate,
                        currentDate: nowDate,
                        groupColor: event.groupColor,
                        arrival: startArrival, //moment(startingDate).format('MM/DD/YYYY'),
                        departure: endDeparture, //moment(departureDate).format('MM/DD/YYYY'),
                        room: event.roomObj,
                        roomType: event.roomTypeObj,
                        status: event.status,
                        totalNights: beforeTotalDays,
                        duration: duration,
                        bookingId: event.booking_id,//event.id,
                        totalTax: parseInt(totalTax),
                        modalOptions: { hideSaveButton: true, modalSize: 'lg', modalTitle: event.text }
                    };
                    _taskStartModal.open({ appCode: "UB01", formData: JSON.stringify(formData) });
                }
            },
            showCleanModal: function (roomId) {
                var formData = { room: roomId };
                _taskStartModal.open({ appCode: "CR01", formData: JSON.stringify(formData) });
            },
            selectedBuildingChanged: function () {
                floors = [];
                $.each(roomTree, function (ind, roomT) {
                    if (roomT.building === selectedBuilding) {
                        if (roomT.floor) {
                            if ($.inArray(roomT.floor, floors) === -1) {
                                floors.push(roomT.floor);
                            }
                        }
                    }
                });

                var floorOptions = "";
                selectedFloor = null;

                $.each(floors, function (j, hfFoor) {
                    if (selectedFloor === null) {
                        selectedFloor = hfFoor;
                        floorOptions += "<option selected value='" + hfFoor + "'>" + hfFoor + "</option>";
                    } else {
                        floorOptions += "<option  value='" + hfFoor + "'>" + hfFoor + "</option>";
                    }
                });

                if (selectedFloor == null) {
                    $('#selectFloor').hide();
                } else {
                    $('#selectFloor').show();
                }

                $('#selectFloor')
                    .find('option')
                    .remove()
                    .end()
                    .append(floorOptions)
                    .val(selectedFloor);
                reservation.renderServerRooms();
            },
        }

        // application starts here
        reservation.init();

        $('#kt_brand').click(function () {

            const LOCAL_STORAGE_KEY_HOTELPMS_HOURLY = 'hotelpms_hourly_' + tenantId;
            const LOCAL_STORAGE_KEY_HOTELPMS_TAX = 'hotelpms_total_tax_' + tenantId;
            const LOCAL_STORAGE_KEY_HOTELPMS_ROOM = 'hotelpms_room_' + tenantId;
            const LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE = 'hotelpms_roomType_' + tenantId;
            const LOCAL_STORAGE_KEY_HOTELPMS_CONFIG = 'hotelpms_config' + tenantId;

            localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_HOURLY);
            localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX);
            localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM);
            localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE);
            localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG);

            location.reload();
        });

        $(".dhx_row_itemrow_item").click(function () {
            console.log('yesy');
        });

        $(".dhx_scell_name").click(function () {
            console.log('glowing click');
        });

        abp.event.on('app.taskCompleted', function (arg) {
            console.log('app.taskCompleted');

            if (arg.appCode == "NA01") {
                localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG);
                location.reload();
            }

            abp.notify.success(app.localize("SuccessfullyProceedTask"));

            reservation.isHourlyView().done(function (isHourly) {
                if (isHourly) {
                    relaodHourlyCalendar(arg);
                } else {
                    reloadNormaCalendar(arg);
                }
            });
        });

        abp.event.on('app.taskProceedSuccess', function () {
            console.log('app.taskProceedSuccess');
            localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM);
            abp.notify.success(app.localize("SuccessfullyProceedTask"));
            reservation.init();
        });

        abp.event.on('app.taskCancelled', function () {
            // maybe task done.
            reservation.isHourlyView().done(function (isHourly) {
                if (isHourly) {
                    relaodHourlyCalendar();
                } else {
                    reloadNormaCalendar();
                }
            });
        });

        abp.event.on('abp.notifications.received', function (userNotification) {
            console.log('abp.notifications.received');
            switch (userNotification.notification.notificationName) {
                case 'App.TaskPerformed':
                    localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM);

                /*
                var loadOptions = { filter: '', sort: '[{ "selector": "sortOrder", "desc": false }]' };
                _dynamicEntityManager.getResourcesByKeyFilter('hotelpms_room', loadOptions).done(function (roomResult) {
                    var json = JSON.stringify(roomResult);
                    localStorage.setItem("hotelpms_room", json);
                    scheduler.updateCollection();
                    //scheduler.setCurrentView();
                    //reservation.init();
                });*/

                //case 'App.TaskSendBack': break; //AwaitingTasks.load(); return; todo
                //case 'App.TaskComplete': break; //AwaitingTasks.load(); return; todo
            }
        });

        var onRoomMove = function (arg) {
            var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
            var nowDate = abp.timing.convertToUserTimezone(now);
            arg.currentDate = nowDate;
            arg.userId = app.session.user.id;
            arg.userName = app.session.user.name,
                _taskStartModal.open({ appCode: "RM01", formData: JSON.stringify(arg) });
        }

        var onRoomMoveAndChangeRate = function (arg) {

            var stat = parseInt(arg.event.status);
            var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
            var nowDate = abp.timing.convertToUserTimezone(now);
            if (stat === 2) {
                abp.message.error("Аль хэдийн тооцоогоо хийсэн байна");
                reloadNormaCalendar();
            } else {
                var bookingId = arg.event.booking_id;

                var endDate = abp.timing.convertToUserTimezone(arg.event.end_date).endOf('day');

                _dynamicEntityManager.getResourceById(arg.targetRoomObj.data.type_id).done(function (targetRoomType) {

                    var targetRoomTypeData = JSON.parse(targetRoomType.document);
                    var targetRoomTypeObj = { id: targetRoomType.id, data: targetRoomTypeData };

                    var formData = {
                        id: arg.event.id, // booked room id   
                        refId: arg.event.refId,
                        room: arg.targetRoomObj,
                        roomType: targetRoomTypeObj,
                        currentRateType: arg.event.rateType,
                        rateType: arg.event.rateType, // for default selection
                        currentRoom: arg.event.roomObj,
                        currentRoomId: arg.event.roomObj.id,
                        currentRoomType: arg.event.roomTypeObj,
                        currentPax: arg.event.adult + '/' + arg.event.child,
                        arrival: abp.timing.convertToUserTimezone(arg.event.start_date).startOf('day'),
                        departure: endDate,
                        status: arg.event.status,
                        totalNights: arg.beforeTotalDays,
                        bookingId: bookingId,
                        adult: arg.event.adult,
                        child: arg.event.child,
                        totalTax: parseInt(totalTax),
                        userId: app.session.user.id,
                        userName: app.session.user.name,
                        currentDate: nowDate
                    };

                    var workingDate = abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day');

                    if (abp.timing.convertToUserTimezone(arg.event.start_date).startOf('day') < workingDate) {
                        _dynamicEntityManager.getResourceById(arg.event.id).done(function (currentBookedRoom) {
                            var currentBookedRoomData = JSON.parse(currentBookedRoom.document);
                            formData.endDate = workingDate.endOf('day');
                            formData.newStartDate = workingDate.startOf('day');
                            formData.newEndDate = endDate;
                            formData.pastEvent = "true";
                            formData.newDescription = currentBookedRoomData.description;
                            formData.newAdult = currentBookedRoomData.adult;
                            formData.newChild = currentBookedRoomData.child;
                            formData.newGroupColor = currentBookedRoomData.groupColor;
                            formData.newRateType = currentBookedRoomData.rateType;

                            var totalStayingDays = endDate.startOf('day').diff(workingDate.startOf('day'), 'days', false);
                            formData.totalNights = totalStayingDays;

                            _taskStartModal.open({
                                appCode: "RM02",
                                formData: JSON.stringify(formData)
                            });
                        });
                    } else {

                        formData.pastEvent = "false";
                        _taskStartModal.open({
                            appCode: "RM02",
                            formData: JSON.stringify(formData)
                        });
                    }
                });
            }
        }

        var onAmendStay = function (arg) {
            var stat = parseInt(arg.event.status);
            var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
            var nowDate = abp.timing.convertToUserTimezone(now);
            if (stat === 2) {
                abp.message.error("Аль хэдийн тооцоогоо хийсэн байна");
                reloadNormaCalendar();
            } else {
                var formData = {
                    id: arg.event.id,
                    bookingId: arg.event.booking_id,
                    refId: arg.event.refId,
                    room: arg.event.roomObj,
                    roomType: arg.event.roomTypeObj,
                    rateType: arg.event.rateType,
                    adult: arg.event.adult,
                    child: arg.event.child,
                    arrival: arg.startDate,
                    departure: arg.endDate,
                    currentArrival: arg.beforeEvent.start_date,
                    currentDeparture: arg.beforeEvent.end_date,
                    workingDate: workingDateGlobal,
                    currentDate: nowDate,
                    totalTax: parseInt(arg.totalTax),
                    userId: app.session.user.id,
                    userName: app.session.user.name,
                    modalOptions: {
                        modalSize: 'xl'
                    }
                };
                _taskStartModal.open({ appCode: "AS01", formData: JSON.stringify(formData) });
            }
        }

        var onNewBooking = function (arg) {

            console.log(arg.workingDate.format());
            var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
            var nowDate = abp.timing.convertToUserTimezone(now);
            _dynamicEntityManager.getResourceById(arg.event.room).done(function (roomResult) {
                var room = { id: arg.event.room, data: JSON.parse(roomResult.document) };

                var arrivalDate = abp.timing.convertToUserTimezone(arg.startDate).add(8, 'hour');
                var departureDate = abp.timing.convertToUserTimezone(arg.endDate);

                var nights = departureDate.diff(arrivalDate, 'days');

                if (hotelConfig.defaultDays) {
                    defaultDay = hotelConfig.defaultDays;
                    var tmp = arrivalDate.format('MM/DD/YYYY HH:MM');
                    if (defaultDay > 0 && defaultDay > nights) {
                        nights = defaultDay;
                        departureDate = abp.timing.convertToUserTimezone(tmp).add(nights, 'days');
                    }
                }

                _dynamicEntityManager.getResourceById(room.data.type_id).done(function (roomTypeResult) {
                    var roomType = { id: roomTypeResult.id, data: JSON.parse(roomTypeResult.document) }
                    var formData = {
                        arrivalMain: arrivalDate,
                        departureMain: departureDate,
                        roomMain: room,
                        nights: nights,
                        roomTypeMain: roomType,
                        status: arg.status,
                        totalTax: parseInt(arg.totalTax),
                        workingDate: abp.timing.convertToUserTimezone(arg.workingDate).startOf('day'),
                        nowDate: nowDate,
                        userId: app.session.user.id,
                        userName: app.session.user.name.toString(),
                        modalOptions: { modalSize: 'xl' }
                    };
                    _taskStartModal.open({ appCode: "NB01", formData: JSON.stringify(formData) });
                });
            });
        }

        var openBookingDetail = function (arg) {
            var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
            var nowDate = abp.timing.convertToUserTimezone(now);
            var balance = arg.deposit - arg.amount;
            var balanceString = "";
            var isAdmin = false;
            var status = parseInt(arg.event.status);
            var _accountService = abp.services.app.account;
            // TODO: Replace reception
            _accountService.isAdmin(abp.session.userId).done(function (checkAdminResult) {
                if (checkAdminResult === true) {
                    isAdmin = true;
                }
                if (status === 5) {
                    var formData = {
                        id: arg.event.id,
                        refId: arg.event.refId,
                        workingDate: arg.workingDate,
                        currentDate: nowDate,
                        arrival: startArrival,
                        departure: endDeparture,
                        room: arg.event.roomObj,
                        roomType: arg.event.roomTypeObj,
                        status: arg.event.status,
                        bookingId: arg.event.booking_id,
                        appSession: app.session,
                        userId: app.session.user.id,
                        userName: app.session.user.name,
                        modalOptions: { hideSaveButton: true, modalSize: 'xl', modalTitle: arg.event.text }
                    };

                    _taskStartModal.open({ appCode: "URB1", formData: JSON.stringify(formData) });
                }
                else {
                    if (balance.toFixed(2) < 0) {
                        balanceString = '<strong class=\"text-danger\">' + balance.toLocaleString() + '</strong>';
                    } else {
                        balanceString = '<strong class=\"text-success\"> +' + balance.toLocaleString() + '</strong>';
                    }
                    if (balance.toFixed(2) === 0) {
                        balanceString = '<strong class=\"text-success\"> ' + balance.toLocaleString() + '</strong>';
                    }

                    var remainDays = arg.endDate.startOf('day').diff(arg.workingDate.startOf('day'), 'days', false);

                    var startArrival = arg.event.start_date; //abp.timing.convertToUserTimezone(arg.event.start_date).format("DD-MMM-YYYY hh:mm");
                    var endDeparture = arg.event.end_date; //abp.timing.convertToUserTimezone(arg.event.end_date).format("DD-MMM-YYYY hh:mm");

                    var duration = arg.beforeTotalDays + " " + app.localize("Nights");

                    if (arg.beforeTotalDays === 1) {
                        duration = "1 " + app.localize("Night");
                    } else {
                        if (arg.beforeTotalDays === 0) {
                            var dur = moment.duration(abp.timing.convertToUserTimezone(arg.event.end_date).diff(abp.timing.convertToUserTimezone(arg.event.start_date)));
                            duration = dur.asHours().toFixed(0) + " " + app.localize("Hour");
                        }
                    }

                    var arrivalRemainDays = abp.timing.convertToUserTimezone(arg.event.start_date).startOf('day').diff(arg.workingDate.startOf('day'), 'days', false);

                    var formData = {
                        id: arg.event.id,
                        refId: arg.event.refId,
                        remainDays: remainDays,
                        arrivalRemainDays: arrivalRemainDays,
                        workingDate: arg.workingDate,
                        currentDate: nowDate,
                        groupColor: arg.event.groupColor,
                        arrival: startArrival,
                        departure: endDeparture,
                        room: arg.event.roomObj,
                        roomType: arg.event.roomTypeObj,
                        adult: arg.event.adult,
                        child: arg.event.child,
                        status: arg.event.status,
                        totalNights: arg.beforeTotalDays,
                        rateType: arg.event.rateType,
                        guestName: arg.event.text,
                        duration: duration,
                        bookingId: arg.event.booking_id,
                        totalTax: parseInt(totalTax),
                        isAdmin: isAdmin,
                        userId: app.session.user.id,
                        userName: app.session.user.name,
                        modalOptions: { hideSaveButton: true, modalSize: 'xl', modalTitle: arg.event.text }
                    };

                    _taskStartModal.open({ appCode: "UB01", formData: JSON.stringify(formData) });
                }
            });


        }

        var openRoomBlock = function (arg) {

        }

        var openNightAuditModal = function () {
            var loadOptions = { filter: '[["startDate","<=","' + abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day').format('YYYY-MM-DD') + '::date"],"and", [["endDate",">","' + abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day').format('YYYY-MM-DD') + '::date"]' };
            var now = moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId);
            var nowDate = abp.timing.convertToUserTimezone(now);

            _dynamicEntityManager.getResourcesByKeyFilter('hotelpms_bookedRooms', loadOptions).done(function (pendingBiches) {

                reservation.getHotelConfig().done(function (configResolved) {
                    var hotelConfig = JSON.parse(configResolved);
                    var pendingBookings = [], dueOuts = [], roomStatuses = [];
                    var billFilter = '[', firsRow = true;

                    $.each(pendingBiches.items, function (index, item) {
                        var doc = JSON.parse(item.document), type = "Unconfirmed booking";
                        if (doc.status == 4) {
                            type = "Confirmed booking";
                        }
                        var remainingDay = abp.timing.convertToUserTimezone(doc.endDate).startOf('day').diff(workingDateGlobal.startOf('day'), 'days', false);
                        var roomtext;
                        if (doc.room) { roomtext = doc.room.data.name + ", "; }
                        roomtext += doc.roomType.data.name;

                        if (firsRow === true) {
                            billFilter += '["booking_id", "=", ' + doc.booking_id + ']';
                            firsRow = false;
                        } else {
                            billFilter += ',"or", ["booking_id", "=", ' + doc.booking_id + ']';
                        }

                        var item = {
                            id: item.id,// booked room id:
                            refId: item.refId,
                            roomName: roomtext,
                            bookingId: doc.booking_id,
                            description: doc.description,
                            reservationType: type,
                            room: doc.room,
                            roomType: doc.roomType,
                            arrival: doc.startDate,
                            departure: doc.endDate,
                            guest: doc.guest,
                            adult: doc.adult,
                            child: doc.child,
                            company: doc.company
                        };

                        if (remainingDay == 1 && doc.status == 1) {
                            dueOuts.push(item);
                        } else if (doc.status == 4 || doc.status == 0) {
                            pendingBookings.push(item);
                        } else {
                            roomStatuses.push(item);
                        }
                    });
                    billFilter += ']';

                    _dynamicEntityManager.getResourcesByKeyFilter('hotelpms_bill', { filter: billFilter }).done(function (billResult) {
                        _dynamicEntityManager.getResourcesByKeyFilter('hotelpms_billPay', { filter: billFilter }).done(function (billPayResult) {
                            _dynamicEntityManager.getResourcesByKey('hotelpms_currency').done(function (currencyResult) {

                                var currencies = $.map(currencyResult, function (curr) {
                                    var currency = JSON.parse(curr.document);
                                    if (currency.isBase === true) { baseCurrency = currency.code; }
                                    return currency;
                                });

                                var bills = $.map(billResult.items, function (bill) {
                                    var billData = JSON.parse(bill.document);
                                    if (bill.isDeleted === false) {
                                        billData.creationTime = abp.timing.convertToUserTimezone(bill.creationTime).format('YYYY-MM-DD hh:mm');
                                        if (billData.totalAmount) {

                                            var calulatedTotal = 0;
                                            if (baseCurrency === billData.currency) {
                                                calulatedTotal = billData.totalAmount;
                                            } else {
                                                var rate = findRate(billData.currency, currencies);
                                                calulatedTotal = Math.imul(billData.totalAmount, rate);
                                            }
                                            billData.totalAmount = calulatedTotal;

                                        }
                                        return billData;
                                    }
                                });

                                var billPays = $.map(billPayResult.items, function (billPay) { return JSON.parse(billPay.document); });

                                $.each(roomStatuses, function (indRoomStatus, roomStatus) {
                                    var roomId = roomStatus.room.id, totalAmount = 0, deposit = 0;
                                    if (roomStatus.refId !== undefined && parseInt(roomStatus.refId) !== 0) { roomId = parseInt(roomStatus.refId); }

                                    var relatedBills = $.grep(bills, function (bill) {
                                        var dayDiff = abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day').diff(abp.timing.convertToUserTimezone(bill.quantity).startOf('day'), 'days', false);
                                        if (bill.refId === roomId && dayDiff === 0) {
                                            return bill;
                                        }
                                    });

                                    var relatedBillPays = $.grep(billPays, function (billPay) {
                                        if (roomStatus.bookingId === billPay.booking_id) {
                                            return billPay;
                                        }
                                    });
                                    $.each(relatedBills, function (i, relatedBill) { totalAmount = totalAmount + relatedBill.totalAmount; });

                                    $.each(relatedBillPays, function (j, relatedBillPay) { deposit = deposit + relatedBillPay.paidAmount; });

                                    // set amount here
                                    roomStatuses[indRoomStatus].totalAmount = totalAmount;
                                    roomStatuses[indRoomStatus].totalAmountFormatted = totalAmount.toLocaleString();
                                    roomStatuses[indRoomStatus].deposit = deposit;
                                    roomStatuses[indRoomStatus].depositFormatted = deposit.toLocaleString();
                                });

                                var formData = {
                                    hotelConfigId: hotelConfig.id,
                                    pendingR: pendingBookings,
                                    dueOuts: dueOuts,
                                    roomStatuses: roomStatuses,
                                    nowDate: nowDate,
                                    workingDay: abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day'),
                                    totalTax: parseInt(totalTax),
                                    userId: app.session.user.id,
                                    userName: app.session.user.name,
                                    modalOptions: { modalSize: 'xl' },
                                    workingDateShort: abp.timing.convertToUserTimezone(workingDateGlobal).startOf('day').format('DD-MM-YYYY').toString()
                                };
                                _taskStartModal.open({
                                    appCode: "NA01",
                                    formData: JSON.stringify(formData)
                                });
                                _taskStartModal.onClose(function () {

                                    //localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_TAX);
                                    //localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOM);
                                    //localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_ROOMTYPE);
                                    //localStorage.removeItem(LOCAL_STORAGE_KEY_HOTELPMS_CONFIG);
                                    //reservation.init();
                                    //location.reload();
                                });
                            });
                        });
                    });

                });
            });
        }

        var openSessionModal = function (session, session_id) {
            var start = abp.timing.convertToUserTimezone(session.startDate)
            var now = abp.timing.convertToUserTimezone(moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId));

            var formData = {
                lastSession: session,
                lastSessionId: session_id,
                message: "Receptionist: " + session.receptionName + " doesn't ended session yet, would you like to stop his(her) session and <br /> Start new session ?",
                receptionId: app.session.user.id,
                receptionName: app.session.user.name,
                receptionSurmame: app.session.user.surname,
                startDate: start,
                workingDate: session.workingDate,
                endDate: now,
                //lasStartingBalance: startBalanceResult,
                //lastData: currentDataResult,
                //LastEndingBalance: endBalanceResult,
                //lastReceptionSummary: receptionSummary,
                endingCashBalance: 0 // TODO: read from balance
            };
            _taskStartModal.open({ appCode: "SS01", formData: JSON.stringify(formData) });
            _taskStartModal.onClose(function () {
                location.reload();
            });

            //LoadSessionStartBalance(start).done(function (startBalanceResult) {
            //    LoadSessionCurrentData(start, now).done(function (currentDataResult) {
            //        LoadSessionStartBalance(now).done(function (endBalanceResult) {
            //            var receptionSummary = [];
            //            receptionSummary.push({
            //                sessionId: session_id,
            //                startDate: start.format(),
            //                endDate: now.format(),
            //                workingDate: session.workingDate,
            //                groupId: 1,
            //                groupName: "Start Balance",
            //                subGroupId: 1,
            //                subGroupName: "Start Balance",
            //                parameterId: 1,
            //                parameterName: "Received rooms",
            //                roomCount: startBalanceResult.totalRooms,
            //                rooms: (startBalanceResult.totalRooms !== 0) ? startBalanceResult.totalRooms.toString() : "",
            //                amount: startBalanceResult.balance
            //            });
            //            $.each(currentDataResult.roomChargesSummary, function (ind, rcItem) {
            //                receptionSummary.push({
            //                    sessionId: session_id,
            //                    startDate: start.format(),
            //                    endDate: now.format(),
            //                    workingDate: session.workingDate,
            //                    groupId: rcItem.groupId,
            //                    groupName: rcItem.groupName,
            //                    subGroupId: rcItem.subGroupId,
            //                    subGroupName: rcItem.subGroupName,
            //                    parameterId: rcItem.parameterId,
            //                    parameterName: rcItem.parameterName,
            //                    roomCount: 0,
            //                    rooms: (rcItem.rooms !== 0) ? rcItem.rooms.toString() : "",
            //                    amount: rcItem.amount
            //                });
            //            });
            //            $.each(currentDataResult.extraChargeSummary, function (ind, rcItem) {
            //                receptionSummary.push({
            //                    sessionId: session_id,
            //                    startDate: start.format(),
            //                    endDate: now.format(),
            //                    workingDate: session.workingDate,
            //                    groupId: rcItem.groupId,
            //                    groupName: rcItem.groupName,
            //                    subGroupId: rcItem.subGroupId,
            //                    subGroupName: rcItem.subGroupName,
            //                    parameterId: rcItem.parameterId,
            //                    parameterName: rcItem.parameterName,
            //                    roomCount: 0,
            //                    rooms: (rcItem.rooms !== 0) ? rcItem.rooms.toString() : "",
            //                    amount: rcItem.amount
            //                });
            //            });
            //            $.each(currentDataResult.paymentsSummary, function (ind, rcItem) {
            //                receptionSummary.push({
            //                    sessionId: session_id,
            //                    startDate: start.format(),
            //                    endDate: now.format(),
            //                    workingDate: session.workingDate,
            //                    groupId: rcItem.groupId,
            //                    groupName: rcItem.groupName,
            //                    subGroupId: rcItem.subGroupId,
            //                    subGroupName: rcItem.subGroupName,
            //                    parameterId: rcItem.parameterId,
            //                    parameterName: rcItem.parameterName,
            //                    roomCount: 0,
            //                    rooms: (rcItem.rooms !== 0) ? rcItem.rooms.toString() : "",
            //                    amount: -rcItem.paidAmountCalculated
            //                });
            //            });
            //            receptionSummary.push({
            //                sessionId: session_id,
            //                startDate: start.format(),
            //                endDate: now.format(),
            //                workingDate: session.workingDate,
            //                groupId: 5,
            //                groupName: "Room count",
            //                subGroupId: 1,
            //                subGroupName: "Room count",
            //                parameterId: 1,
            //                parameterName: "Checked In",
            //                roomCount: currentDataResult.checkedIn.length,
            //                rooms: currentDataResult.checkedIn.length.toString(),
            //                amount: 0
            //            });
            //            receptionSummary.push({
            //                sessionId: session_id,
            //                startDate: start.format(),
            //                endDate: now.format(),
            //                workingDate: session.workingDate,
            //                groupId: 5,
            //                groupName: "Room count",
            //                subGroupId: 1,
            //                subGroupName: "Room count",
            //                parameterId: 2,
            //                parameterName: "Checked Out",
            //                roomCount: -currentDataResult.checkedOut.length,
            //                rooms: currentDataResult.checkedOut.length.toString(),
            //                amount: 0
            //            });



            //            console.log(' ask to stop fking session:');

            //        });
            //    });
            //});

        }

        var reloadNormaCalendar = function () {
            reservation.getServerRoomBookings().done(function (bookings) {
                scheduler.clearAll();
                scheduler.parse(bookings);
                //reservation.renderCalendar(workingDateGlobal, roomTree, bookings);
            });
        }

        var relaodHourlyCalendar = function () {
            reservation.getServerRoomBookingsHourly().done(function (bookings) {
                scheduler.clearAll();
                scheduler.parse(bookings);
            });
        }

        $(".selectBuilding").on(function (event) {
            console.log('building changed...');
        });

        $(".selectFloor").on(function (event) {
            console.log('floor changed...');
        });

        function findRate(rateCode, currencies) {
            console.log('find rate ???..');
            var index = 0, found, entry, isFound = false;
            for (index = 0; index < currencies.length; ++index) {
                entry = currencies[index];
                if (entry.code == rateCode) {
                    isFound = true;
                    found = entry; break;
                }
            }
            if (isFound) {
                return found.rate;
            } else { return 1; }
        }

        function findByBookingIdRefId(booking_id, refId, myArray) {
            var ind = -1;
            for (let i = 0; i < myArray.length; i++) {
                if (myArray[i].booking_id === booking_id && (refId === 0 || myArray[i].refId === refId)) {
                    return i;
                }
            }
            return ind;
        }

        function LoadSessionStartBalance(startDate) {
            var _deferred = $.Deferred();
            var queryFilterBill1 = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedOutDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedOutDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "greaterOrEqual"
                        },
                        "includes": []
                    }
                ]
            };
            var queryFilterBill2 = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.status",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.status",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "contains"
                        },
                        "includes": ["1", "3", "6", "8"]
                    }
                ]
            };
            var billFilterInput1 = {
                data: "hotelpms_bill",
                group: "",
                joins: ['{ id: "hotelpms_bill/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_bill", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterBill1),
                sort: null
            };
            var billFilterInput2 = {
                data: "hotelpms_bill",
                group: "",
                joins: ['{ id: "hotelpms_bill/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_bill", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterBill2),
                sort: null
            };
            var queryFilterBillPay1 = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedOutDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedOutDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "greaterOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_billPay.postedDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_billPay.postedDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    }
                ]
            };
            var queryFilterBillPay2 = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.status",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.status",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "contains"
                        },
                        "includes": ["1", "3", "6", "8"]
                    },
                    {
                        "field": "hotelpms_billPay.postedDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_billPay.postedDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    }
                ]
            };
            var billPayFilterInput1 = {
                data: "hotelpms_billPay",
                group: "",
                joins: ['{ id: "hotelpms_billPay/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_billPay", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterBillPay1),
                sort: null
            };
            var billPayFilterInput2 = {
                data: "hotelpms_billPay",
                group: "",
                joins: ['{ id: "hotelpms_billPay/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_billPay", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterBillPay2),
                sort: null
            };

            _reportManager.getReportData(billFilterInput1).done(function (billResult1) {
                _reportManager.getReportData(billFilterInput2).done(function (billResult2) {
                    _reportManager.getReportData(billPayFilterInput1).done(function (billPayResult1) {
                        _reportManager.getReportData(billPayFilterInput2).done(function (billPayResult2) {
                            _dynamicEntityManager.getResourcesByKey('hotelpms_currency').done(function (currencyResult) {
                                var baseCurrency = "", baseCurr = {};
                                var pendingBookedRooms = [];
                                var currencies = $.map(currencyResult, function (curr) {
                                    var currency = JSON.parse(curr.document);
                                    if (currency.isBase === true) {
                                        baseCurrency = currency.code;
                                        baseCurr = currency;
                                    }
                                    return currency;
                                });
                                $.merge(billResult1, billResult2);
                                $.merge(billPayResult1, billPayResult2);

                                var bills = $.map(billResult1, function (bill) {
                                    if (bill.isDeleted === false) {
                                        var billItem = JSON.parse(bill.document);
                                        billItem.hotelpms_bill.id = bill.id;
                                        if (!billItem.hotelpms_bill.refId) { billItem.hotelpms_bill.refId = 1; }
                                        if (!billItem.hotelpms_bookedRooms.refId) { billItem.hotelpms_bookedRooms.refId = 1; }
                                        //billItem.hotelpms_bill.booking.data = billItem.hotelpms_booking;
                                        var billData = billItem.hotelpms_bill;
                                        var date1 = abp.timing.convertToUserTimezone(bill.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                        if (billData.chargeDate) { date1 = billData.chargeDate; }
                                        else {
                                            if (billData.itemGroup && billData.itemGroup === "Room" && billData.quantity) {
                                                date1 = billData.quantity.split("-").reverse().join("-").toString();
                                            }
                                        }
                                        billData.date = date1;
                                        if (!billData.calculatedTotal) {
                                            var calculatedTotal = 0;
                                            if (baseCurrency === billData.currency) {
                                                calculatedTotal = billData.totalAmount;
                                            } else {
                                                var rate = findRate(billData.currency, currencies);
                                                calculatedTotal = Math.imul(billData.totalAmount, rate);
                                            }
                                            billData.calculatedTotal = calculatedTotal;
                                        }
                                        if (billData.refId > 100 || billItem.hotelpms_bookedRooms.refId > 100 || billData.refId === billItem.hotelpms_bookedRooms.refId) {
                                            //billItem.hotelpms_bill.bookedRoom.data = billItem.hotelpms_bookedRooms;
                                            if (pendingBookedRooms.length === 0) {
                                                billItem.hotelpms_bookedRooms.bills = [];
                                                billItem.hotelpms_bookedRooms.billPays = [];
                                                if (billData.postedDate) {
                                                    if (abp.timing.convertToUserTimezone(startDate).diff(abp.timing.convertToUserTimezone(billData.postedDate)) >= 0) {
                                                        billItem.hotelpms_bookedRooms.bills.push(billData);
                                                    }
                                                }
                                                pendingBookedRooms.push(billItem.hotelpms_bookedRooms);
                                            }
                                            else {
                                                var bookedRoomsArrayId = findByBookingIdRefId(billItem.hotelpms_bookedRooms.booking_id, billItem.hotelpms_bookedRooms.refId, pendingBookedRooms);
                                                if (bookedRoomsArrayId === -1) {
                                                    billItem.hotelpms_bookedRooms.bills = [];
                                                    billItem.hotelpms_bookedRooms.billPays = [];
                                                    if (billData.postedDate) {
                                                        if (abp.timing.convertToUserTimezone(startDate).diff(abp.timing.convertToUserTimezone(billData.postedDate)) >= 0) {
                                                            billItem.hotelpms_bookedRooms.bills.push(billData);
                                                        }
                                                    }
                                                    pendingBookedRooms.push(billItem.hotelpms_bookedRooms);
                                                }
                                                else {
                                                    if (billData.postedDate) {
                                                        if (abp.timing.convertToUserTimezone(startDate).diff(abp.timing.convertToUserTimezone(billData.postedDate)) >= 0) {
                                                            pendingBookedRooms[bookedRoomsArrayId].bills.push(billData);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        return billData;
                                    }
                                });

                                var billPays = $.map(billPayResult1, function (billPay) {
                                    if (billPay.isDeleted === false) {
                                        var billPayItem = JSON.parse(billPay.document);
                                        billPayItem.hotelpms_billPay.id = billPay.id;
                                        if (!billPayItem.hotelpms_billPay.refId) { billPayItem.hotelpms_billPay.refId = 1; }
                                        if (!billPayItem.hotelpms_bookedRooms.refId) { billPayItem.hotelpms_bookedRooms.refId = 1; }
                                        //billPayItem.hotelpms_billPay.booking.data = billPayItem.hotelpms_booking;
                                        var billPayData = billPayItem.hotelpms_billPay;
                                        var date1 = abp.timing.convertToUserTimezone(billPay.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                        if (billPayData.paidDate) { date1 = billPayData.paidDate; }
                                        billPayData.date = date1;
                                        if (!billPayData.amountCalculated) {
                                            var amountCalculated = 0;
                                            if (billPayData.currency.data !== undefined) {
                                                amountCalculated = Math.imul(billPayData.paidAmount, billPayData.currency.data.rate);
                                            }
                                            else { amountCalculated = parseFloat(billPayData.paidAmount); }
                                            billPayData.amountCalculated = amountCalculated;
                                        }
                                        if (billPayData.refId > 100 || billPayItem.hotelpms_bookedRooms.refId > 100 || billPayData.refId === billPayItem.hotelpms_bookedRooms.refId) {
                                            //billPayItem.hotelpms_billPay.bookedRoom = { data: billPayItem.hotelpms_bookedRooms };
                                            if (pendingBookedRooms.length === 0) {
                                                billPayItem.hotelpms_bookedRooms.bills = [];
                                                billPayItem.hotelpms_bookedRooms.billPays = [];
                                                billPayItem.hotelpms_bookedRooms.billPays.push(billPayData);
                                                pendingBookedRooms.push(billPayItem.hotelpms_bookedRooms);
                                            }
                                            else {
                                                var bookedRoomArrayId = findByBookingIdRefId(billPayItem.hotelpms_bookedRooms.booking_id, billPayItem.hotelpms_bookedRooms.refId, pendingBookedRooms);
                                                if (bookedRoomArrayId === -1) {
                                                    billPayItem.hotelpms_bookedRooms.billPays = [];
                                                    billPayItem.hotelpms_bookedRooms.billPays = [];
                                                    billPayItem.hotelpms_bookedRooms.billPays.push(billPayData);
                                                    pendingBookedRooms.push(billPayItem.hotelpms_bookedRooms);
                                                }
                                                else {
                                                    pendingBookedRooms[bookedRoomArrayId].billPays.push(billPayData);
                                                }
                                            }
                                        }
                                        else { return null; }
                                        return billPayData;
                                    }
                                    else { return null; }
                                });

                                var grandTotalCharge = 0, grandTotalPay = 0, totalRooms = 0, totalAdult = 0, totalChild = 0;
                                $.each(pendingBookedRooms, function (index, bookedRoomItem) {
                                    var totalCharge = 0, totalPay = 0;
                                    if (bookedRoomItem.bills) {
                                        $.each(bookedRoomItem.bills, function (ind, billData) {
                                            totalCharge += parseFloat(billData.calculatedTotal)
                                        });
                                    }
                                    if (bookedRoomItem.billPays) {
                                        $.each(bookedRoomItem.billPays, function (ind, billPayData) {
                                            totalPay += parseFloat(billPayData.amountCalculated);
                                        });
                                    }
                                    bookedRoomItem.totalCharge = totalCharge;
                                    bookedRoomItem.totalPay = totalPay;
                                    bookedRoomItem.balance = totalPay - totalCharge;
                                    grandTotalCharge += totalCharge;
                                    grandTotalPay += totalPay;
                                    totalRooms++;
                                    totalAdult += bookedRoomItem.adult;
                                    totalChild += bookedRoomItem.child;
                                });
                                var grandBalance = grandTotalCharge - grandTotalPay;

                                _deferred.resolve({
                                    bookedRooms: pendingBookedRooms,
                                    totalCharge: grandTotalCharge,
                                    totalPay: grandTotalPay,
                                    balance: grandBalance,
                                    totalRooms: totalRooms,
                                    totalAdult: totalAdult,
                                    totalChild: totalChild
                                });
                            });
                        });
                    });
                });
            });

            return _deferred.promise();
        }

        function LoadSessionCurrentData(startDate, endDate) {
            var _deferred = $.Deferred();

            var queryFilterCheckedIn = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "greaterOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedInDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(endDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    }
                ]
            };
            var queryFilterCheckedOut = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_bookedRooms.checkedOutDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedOutDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "greaterOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bookedRooms.checkedOutDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(endDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    }
                ]
            };
            var queryFilterBillPosted = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_bill.postedDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bill.postedDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "greaterOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bill.postedDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(endDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bill.isPosted",
                        "type": "text",
                        "condition": {
                            "filter": "true",
                            "type": "equal"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_bill.isDeleted",
                        "type": "text",
                        "condition": {
                            "filter": "false",
                            "type": "equal"
                        },
                        "includes": []
                    }
                ]
            };
            var queryFilterBillPayPosted = {
                "glue": "and",
                "rules": [
                    {
                        "field": "hotelpms_billPay.postedDate",
                        "type": "text",
                        "condition": {
                            "filter": "",
                            "type": "notEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_billPay.postedDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(startDate),
                            "type": "greaterOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_billPay.postedDate",
                        "type": "timestamptz",
                        "condition": {
                            "filter": abp.timing.convertToUserTimezone(endDate),
                            "type": "lessOrEqual"
                        },
                        "includes": []
                    },
                    {
                        "field": "hotelpms_billPay.isDeleted",
                        "type": "text",
                        "condition": {
                            "filter": "false",
                            "type": "equal"
                        },
                        "includes": []
                    }
                ]
            };

            var billFilterCheckedIn = {
                data: "hotelpms_bill",
                group: "",
                joins: ['{ id: "hotelpms_bill/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_bill", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterCheckedIn),
                sort: null
            };
            var billFilterCheckedOut = {
                data: "hotelpms_bill",
                group: "",
                joins: ['{ id: "hotelpms_bill/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_bill", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterCheckedOut),
                sort: null
            };
            var billFilterPosted = {
                data: "hotelpms_bill",
                group: "",
                joins: ['{ id: "hotelpms_bill/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_bill", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterBillPosted),
                sort: null
            };
            var billPayFilterCheckedIn = {
                data: "hotelpms_billPay",
                group: "",
                joins: ['{ id: "hotelpms_billPay/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_billPay", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterCheckedIn),
                sort: null
            };
            var billPayFilterCheckedOut = {
                data: "hotelpms_billPay",
                group: "",
                joins: ['{ id: "hotelpms_billPay/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_billPay", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterCheckedOut),
                sort: null
            };
            var billPayFilterPosted = {
                data: "hotelpms_billPay",
                group: "",
                joins: ['{ id: "hotelpms_billPay/booking_id//hotelpms_booking", sf: "booking_id", sid: "hotelpms_billPay", tid: "hotelpms_booking" }',
                    '{ id: "hotelpms_bookedRooms/booking_id//hotelpms_booking", tf: "booking_id", sid: "hotelpms_booking", tid: "hotelpms_bookedRooms" }'],
                query: JSON.stringify(queryFilterBillPayPosted),
                sort: null
            };

            _reportManager.getReportData(billFilterCheckedIn).done(function (billResultCheckedIn) {
                _reportManager.getReportData(billFilterCheckedOut).done(function (billResultCheckedOut) {
                    _reportManager.getReportData(billFilterPosted).done(function (billResultPosted) {
                        _reportManager.getReportData(billPayFilterCheckedIn).done(function (billPayResultCheckedIn) {
                            _reportManager.getReportData(billPayFilterCheckedOut).done(function (billPayResultCheckedOut) {
                                _reportManager.getReportData(billPayFilterPosted).done(function (billPayResultPosted) {
                                    _dynamicEntityManager.getResourcesByKey('hotelpms_currency').done(function (currencyResult) {
                                        var baseCurrency = "", baseCurr = {};
                                        var bookingCheckedIn = [], bookingCheckedOut = [], roomCharges = [], extraCharges = [], roomChargesSummary = [], extraChargeSummary = [], extraChargeSummary1 = [], payments = [], paymentsSummary = [];
                                        var rcTotalAmount = 0, ecTotalAmount = 0, revenueTotal = 0, paidAmount = 0, invoiceAmount = 0, totalPaid = 0;
                                        var currencies = $.map(currencyResult, function (curr) {
                                            var currency = JSON.parse(curr.document);
                                            if (currency.isBase === true) {
                                                baseCurrency = currency.code;
                                                baseCurr = currency;
                                            }
                                            return currency;
                                        });

                                        $.each(billResultCheckedIn, function (ind, bill) {
                                            if (bill.isDeleted === false) {
                                                var billItem = JSON.parse(bill.document);
                                                billItem.hotelpms_bill.id = bill.id;
                                                if (!billItem.hotelpms_bill.refId) { billItem.hotelpms_bill.refId = 1; }
                                                if (!billItem.hotelpms_bookedRooms.refId) { billItem.hotelpms_bookedRooms.refId = 1; }
                                                var billData = billItem.hotelpms_bill;
                                                var date1 = abp.timing.convertToUserTimezone(bill.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                                if (billData.chargeDate) { date1 = billData.chargeDate; }
                                                else {
                                                    if (billData.itemGroup && billData.itemGroup === "Room" && billData.quantity) {
                                                        date1 = billData.quantity.split("-").reverse().join("-").toString();
                                                    }
                                                }
                                                billData.date = date1;
                                                if (!billData.calculatedTotal) {
                                                    var calculatedTotal = 0;
                                                    if (baseCurrency === billData.currency) {
                                                        calculatedTotal = billData.totalAmount;
                                                    } else {
                                                        var rate = findRate(billData.currency, currencies);
                                                        calculatedTotal = Math.imul(billData.totalAmount, rate);
                                                    }
                                                    billData.calculatedTotal = calculatedTotal;
                                                }
                                                if (billData.refId > 100 || billItem.hotelpms_bookedRooms.refId > 100 || billData.refId === billItem.hotelpms_bookedRooms.refId) {
                                                    if (bookingCheckedIn.length === 0) {
                                                        billItem.hotelpms_bookedRooms.booking.data = billItem.hotelpms_booking;
                                                        billItem.hotelpms_bookedRooms.bills = [];
                                                        billItem.hotelpms_bookedRooms.billPays = [];
                                                        billItem.hotelpms_bookedRooms.bills.push(billData);
                                                        bookingCheckedIn.push(billItem.hotelpms_bookedRooms);
                                                    }
                                                    else {
                                                        var bookedRoomsArrayId = findByBookingIdRefId(billItem.hotelpms_bookedRooms.booking_id, billItem.hotelpms_bookedRooms.refId, bookingCheckedIn);
                                                        if (bookedRoomsArrayId === -1) {
                                                            billItem.hotelpms_bookedRooms.booking.data = billItem.hotelpms_booking;
                                                            billItem.hotelpms_bookedRooms.bills = [];
                                                            billItem.hotelpms_bookedRooms.billPays = [];
                                                            billItem.hotelpms_bookedRooms.bills.push(billData);
                                                            bookingCheckedIn.push(billItem.hotelpms_bookedRooms);
                                                        }
                                                        else {
                                                            bookingCheckedIn[bookedRoomsArrayId].bills.push(billData);
                                                        }
                                                    }
                                                }
                                            }
                                        });

                                        $.each(billPayResultCheckedIn, function (ind, billPay) {
                                            if (billPay.isDeleted === false) {
                                                var billPayItem = JSON.parse(billPay.document);
                                                billPayItem.hotelpms_billPay.id = billPay.id;
                                                if (!billPayItem.hotelpms_billPay.refId) { billPayItem.hotelpms_billPay.refId = 1; }
                                                if (!billPayItem.hotelpms_bookedRooms.refId) { billPayItem.hotelpms_bookedRooms.refId = 1; }
                                                var billPayData = billPayItem.hotelpms_billPay;
                                                var date1 = abp.timing.convertToUserTimezone(billPay.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                                if (billPayData.paidDate) { date1 = billPayData.paidDate; }
                                                billPayData.date = date1;
                                                if (!billPayData.amountCalculated) {
                                                    var amountCalculated = 0;
                                                    if (billPayData.currency.data !== undefined) {
                                                        amountCalculated = Math.imul(billPayData.paidAmount, billPayData.currency.data.rate);
                                                    }
                                                    else { amountCalculated = parseFloat(billPayData.paidAmount); }
                                                    billPayData.amountCalculated = amountCalculated;
                                                }
                                                if (billPayData.refId > 100 || billPayItem.hotelpms_bookedRooms.refId > 100 || billPayData.refId === billPayItem.hotelpms_bookedRooms.refId) {
                                                    if (bookingCheckedIn.length === 0) {
                                                        billPayItem.hotelpms_bookedRooms.booking.data = billPayItem.hotelpms_booking;
                                                        billPayItem.hotelpms_bookedRooms.bills = [];
                                                        billPayItem.hotelpms_bookedRooms.billPays = [];
                                                        billPayItem.hotelpms_bookedRooms.billPays.push(billPayData);
                                                        bookingCheckedIn.push(billPayItem.hotelpms_bookedRooms);
                                                    }
                                                    else {
                                                        var bookedRoomArrayId = findByBookingIdRefId(billPayItem.hotelpms_bookedRooms.booking_id, billPayItem.hotelpms_bookedRooms.refId, bookingCheckedIn);
                                                        if (bookedRoomArrayId === -1) {
                                                            billPayItem.hotelpms_bookedRooms.booking.data = billPayItem.hotelpms_booking;
                                                            billPayItem.hotelpms_bookedRooms.billPays = [];
                                                            billPayItem.hotelpms_bookedRooms.billPays = [];
                                                            billPayItem.hotelpms_bookedRooms.billPays.push(billPayData);
                                                            bookingCheckedIn.push(billPayItem.hotelpms_bookedRooms);
                                                        }
                                                        else {
                                                            bookingCheckedIn[bookedRoomArrayId].billPays.push(billPayData);
                                                        }
                                                    }
                                                }
                                            }
                                        });

                                        $.each(billResultCheckedOut, function (ind, bill) {
                                            if (bill.isDeleted === false) {
                                                var billItem = JSON.parse(bill.document);
                                                billItem.hotelpms_bookedRooms.nights = abp.timing.convertToUserTimezone(billItem.hotelpms_bookedRooms.endDate).diff(abp.timing.convertToUserTimezone(billItem.hotelpms_bookedRooms.startDate), 'days');
                                                billItem.hotelpms_bill.id = bill.id;
                                                if (!billItem.hotelpms_bill.refId) { billItem.hotelpms_bill.refId = 1; }
                                                if (!billItem.hotelpms_bookedRooms.refId) { billItem.hotelpms_bookedRooms.refId = 1; }
                                                var billData = billItem.hotelpms_bill;
                                                var date1 = abp.timing.convertToUserTimezone(bill.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                                if (billData.chargeDate) { date1 = billData.chargeDate; }
                                                else {
                                                    if (billData.itemGroup && billData.itemGroup === "Room" && billData.quantity) {
                                                        date1 = billData.quantity.split("-").reverse().join("-").toString();
                                                    }
                                                }
                                                billData.date = date1;
                                                if (!billData.calculatedTotal) {
                                                    var calculatedTotal = 0;
                                                    if (baseCurrency === billData.currency) {
                                                        calculatedTotal = billData.totalAmount;
                                                    } else {
                                                        var rate = findRate(billData.currency, currencies);
                                                        calculatedTotal = Math.imul(billData.totalAmount, rate);
                                                    }
                                                    billData.calculatedTotal = calculatedTotal;
                                                }
                                                if (billData.refId > 100 || billItem.hotelpms_bookedRooms.refId > 100 || billData.refId === billItem.hotelpms_bookedRooms.refId) {
                                                    var isPosted = billData.isPosted;
                                                    if (bookingCheckedOut.length === 0) {
                                                        billItem.hotelpms_bookedRooms.booking.data = billItem.hotelpms_booking;
                                                        billItem.hotelpms_bookedRooms.bills = [];
                                                        billItem.hotelpms_bookedRooms.roomCharges = [];
                                                        billItem.hotelpms_bookedRooms.extraCharges = [];
                                                        billItem.hotelpms_bookedRooms.billPays = [];
                                                        if (isPosted.toString() === "true" && billData.isDeleted === false) {
                                                            billItem.hotelpms_bookedRooms.bills.push(billData);
                                                            if (billData.type === 'extraCharge') { billItem.hotelpms_bookedRooms.extraCharges.push(billData); }
                                                            else { billItem.hotelpms_bookedRooms.roomCharges.push(billData); }
                                                        }
                                                        bookingCheckedOut.push(billItem.hotelpms_bookedRooms);
                                                    }
                                                    else {
                                                        var bookedRoomsArrayId = findByBookingIdRefId(billItem.hotelpms_bookedRooms.booking_id, billItem.hotelpms_bookedRooms.refId, bookingCheckedOut);
                                                        if (bookedRoomsArrayId === -1) {
                                                            billItem.hotelpms_bookedRooms.booking.data = billItem.hotelpms_booking;
                                                            billItem.hotelpms_bookedRooms.bills = [];
                                                            billItem.hotelpms_bookedRooms.roomCharges = [];
                                                            billItem.hotelpms_bookedRooms.extraCharges = [];
                                                            billItem.hotelpms_bookedRooms.billPays = [];
                                                            if (isPosted.toString() === "true" && billData.isDeleted === false) {
                                                                billItem.hotelpms_bookedRooms.bills.push(billData);
                                                                if (billData.type === 'extraCharge') { billItem.hotelpms_bookedRooms.extraCharges.push(billData); }
                                                                else { billItem.hotelpms_bookedRooms.roomCharges.push(billData); }
                                                            }
                                                            bookingCheckedOut.push(billItem.hotelpms_bookedRooms);
                                                        }
                                                        else {
                                                            if (isPosted.toString() === "true" && billData.isDeleted === false) {
                                                                bookingCheckedOut[bookedRoomsArrayId].bills.push(billData);
                                                                if (billData.type === 'extraCharge') { bookingCheckedOut[bookedRoomsArrayId].extraCharges.push(billData); }
                                                                else { bookingCheckedOut[bookedRoomsArrayId].roomCharges.push(billData); }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        });

                                        $.each(billPayResultCheckedOut, function (ind, billPay) {
                                            if (billPay.isDeleted === false) {
                                                var billPayItem = JSON.parse(billPay.document);
                                                billPayItem.hotelpms_bookedRooms.nights = abp.timing.convertToUserTimezone(billPayItem.hotelpms_bookedRooms.endDate).diff(abp.timing.convertToUserTimezone(billPayItem.hotelpms_bookedRooms.startDate), 'days');
                                                billPayItem.hotelpms_billPay.id = billPay.id;
                                                if (!billPayItem.hotelpms_billPay.refId) { billPayItem.hotelpms_billPay.refId = 1; }
                                                if (!billPayItem.hotelpms_bookedRooms.refId) { billPayItem.hotelpms_bookedRooms.refId = 1; }
                                                var billPayData = billPayItem.hotelpms_billPay;
                                                var date1 = abp.timing.convertToUserTimezone(billPay.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                                if (billPayData.paidDate) { date1 = billPayData.paidDate; }
                                                billPayData.date = date1;
                                                if (!billPayData.amountCalculated) {
                                                    var amountCalculated = 0;
                                                    if (billPayData.currency.data !== undefined) {
                                                        amountCalculated = Math.imul(billPayData.paidAmount, billPayData.currency.data.rate);
                                                    }
                                                    else { amountCalculated = parseFloat(billPayData.paidAmount); }
                                                    billPayData.amountCalculated = amountCalculated;
                                                }
                                                if (billPayData.refId > 100 || billPayItem.hotelpms_bookedRooms.refId > 100 || billPayData.refId === billPayItem.hotelpms_bookedRooms.refId) {
                                                    if (bookingCheckedOut.length === 0) {
                                                        billPayItem.hotelpms_bookedRooms.bills = [];
                                                        billPayItem.hotelpms_bookedRooms.roomCharges = [];
                                                        billPayItem.hotelpms_bookedRooms.extraCharges = [];
                                                        billPayItem.hotelpms_bookedRooms.billPays = [];
                                                        if (billPayData.isDeleted === false) {
                                                            billPayItem.hotelpms_bookedRooms.billPays.push(billPayData);
                                                        }
                                                        bookingCheckedOut.push(billPayItem.hotelpms_bookedRooms);
                                                    }
                                                    else {
                                                        var bookedRoomArrayId = findByBookingIdRefId(billPayItem.hotelpms_bookedRooms.booking_id, billPayItem.hotelpms_bookedRooms.refId, bookingCheckedOut);
                                                        if (bookedRoomArrayId === -1) {
                                                            billPayItem.hotelpms_bookedRooms.bills = [];
                                                            billPayItem.hotelpms_bookedRooms.roomCharges = [];
                                                            billPayItem.hotelpms_bookedRooms.extraCharges = [];
                                                            billPayItem.hotelpms_bookedRooms.billPays = [];
                                                            if (billPayData.isDeleted === false) {
                                                                billPayItem.hotelpms_bookedRooms.billPays.push(billPayData);
                                                            }
                                                            bookingCheckedOut.push(billPayItem.hotelpms_bookedRooms);
                                                        }
                                                        else {
                                                            if (billPayData.isDeleted === false) {
                                                                bookingCheckedOut[bookedRoomArrayId].billPays.push(billPayData);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        });

                                        $.each(billResultPosted, function (ind, bill) {
                                            var billItem = JSON.parse(bill.document);
                                            if (bill.isDeleted === false) {
                                                billItem.hotelpms_bill.id = bill.id;
                                                if (!billItem.hotelpms_bill.refId) { billItem.hotelpms_bill.refId = 1; }
                                                if (!billItem.hotelpms_bookedRooms.refId) { billItem.hotelpms_bookedRooms.refId = 1; }
                                                var billData = billItem.hotelpms_bill;
                                                var date1 = abp.timing.convertToUserTimezone(bill.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                                if (billData.chargeDate) { date1 = billData.chargeDate; }
                                                else {
                                                    if (billData.itemGroup && billData.itemGroup === "Room" && billData.quantity) {
                                                        date1 = billData.quantity.split("-").reverse().join("-").toString();
                                                    }
                                                }
                                                billData.date = date1;
                                                if (!billData.calculatedTotal) {
                                                    var calculatedTotal = 0;
                                                    if (baseCurrency === billData.currency) {
                                                        calculatedTotal = billData.totalAmount;
                                                    } else {
                                                        var rate = findRate(billData.currency, currencies);
                                                        calculatedTotal = Math.imul(billData.totalAmount, rate);
                                                    }
                                                    billData.calculatedTotal = calculatedTotal;
                                                }
                                                if (billData.refId > 100 || billItem.hotelpms_bookedRooms.refId > 100 || billData.refId === billItem.hotelpms_bookedRooms.refId) {
                                                    billData.bookedRoom = { data: billItem.hotelpms_bookedRooms };
                                                    billData.booking.data = billItem.hotelpms_booking;
                                                    if (billData.type === 'extraCharge') { extraCharges.push(billData); }
                                                    else {
                                                        if (abp.timing.convertToUserTimezone(billData.bookedRoom.data.startDate).diff(abp.timing.convertToUserTimezone(billData.bookedRoom.data.endDate), 'days') === 0) {
                                                            billData.isHourly = true;
                                                        }
                                                        else {
                                                            billData.isHourly = false;
                                                        }
                                                        roomCharges.push(billData);
                                                    }
                                                }
                                            }
                                        });

                                        $.each(billPayResultPosted, function (ind, billPay) {
                                            if (billPay.isDeleted === false) {
                                                var billPayItem = JSON.parse(billPay.document);
                                                billPayItem.hotelpms_billPay.id = billPay.id;
                                                if (!billPayItem.hotelpms_billPay.refId || billPayItem.hotelpms_billPay.refId > 100) { billPayItem.hotelpms_billPay.refId = 1; }
                                                if (!billPayItem.hotelpms_bookedRooms.refId) { billPayItem.hotelpms_bookedRooms.refId = 1; }
                                                var billPayData = billPayItem.hotelpms_billPay;
                                                var date1 = abp.timing.convertToUserTimezone(billPay.creationTime).startOf('day').format('YYYY-MM-DD').toString();
                                                if (billPayData.paidDate) { date1 = billPayData.paidDate; }
                                                billPayData.date = date1;
                                                if (!billPayData.amountCalculated) {
                                                    var amountCalculated = 0;
                                                    if (billPayData.currency.data !== undefined) {
                                                        amountCalculated = Math.imul(billPayData.paidAmount, billPayData.currency.data.rate);
                                                    }
                                                    else { amountCalculated = parseFloat(billPayData.paidAmount); }
                                                    billPayData.amountCalculated = amountCalculated;
                                                }
                                                if (billPayData.refId > 100 || billPayItem.hotelpms_bookedRooms.refId > 100 || billPayData.refId === billPayItem.hotelpms_bookedRooms.refId) {
                                                    if (!billPayData.paymentMethod || !billPayData.paymentMethod.data) {
                                                        switch (billPayData.paymentType) {
                                                            case "cash":
                                                                billPayData.paymentMethod = {
                                                                    data: {
                                                                        isBank: false,
                                                                        isCash: true,
                                                                        isInvoice: false,
                                                                        name: "Cash",
                                                                        type: "cash"
                                                                    }
                                                                };
                                                                break;
                                                            case "bank":
                                                                billPayData.paymentMethod = {
                                                                    data: {
                                                                        isBank: true,
                                                                        isCash: false,
                                                                        isInvoice: false,
                                                                        name: "Bank",
                                                                        type: "bank"
                                                                    }
                                                                };
                                                                break;
                                                            case "invoice":
                                                                billPayData.paymentMethod = {
                                                                    data: {
                                                                        isBank: false,
                                                                        isCash: false,
                                                                        isInvoice: true,
                                                                        name: "Invoice",
                                                                        type: "invoice"
                                                                    }
                                                                };
                                                                break;
                                                        }
                                                    }
                                                    billPayData.bookedRoom = { data: billPayItem.hotelpms_bookedRooms };
                                                    billPayData.booking.data = billPayItem.hotelpms_booking;
                                                    payments.push(billPayData);
                                                }
                                            }
                                        });

                                        $.each(bookingCheckedIn, function (ind, bookingItem) {
                                            var dateString = abp.timing.convertToUserTimezone(bookingItem.startDate).startOf('day').format('YYYY-MM-DD').toString();
                                            if (bookingItem.bills && bookingItem.bills.length > 0) {
                                                var firstDayBill = $.grep(bookingItem.bills, function (bill) {
                                                    if (bill.itemGroup === 'Room' && bill.chargeDate === dateString) {
                                                        return bill;
                                                    }
                                                });
                                                if (firstDayBill.length > 0) {
                                                    bookingItem.dailyRate = firstDayBill[0].calculatedTotal;
                                                    bookingItem.currency = firstDayBill[0].currency;
                                                }
                                                else {
                                                    bookingItem.dailyRate = 0;
                                                    bookingItem.currency = baseCurrency;
                                                }
                                            }
                                        });

                                        $.each(bookingCheckedOut, function (ind, bookingItem) {
                                            var rc = 0, ec = 0, paid = 0;
                                            $.each(bookingItem.roomCharges, function (ind, bill) {
                                                rc += parseFloat(bill.calculatedTotal);
                                            });
                                            $.each(bookingItem.extraCharges, function (ind, bill) {
                                                ec += parseFloat(bill.calculatedTotal);
                                            });
                                            $.each(bookingItem.billPays, function (ind, billPay) {
                                                paid += parseFloat(billPay.amountCalculated);
                                            })
                                            bookingItem.roomChargeAmount = rc;
                                            bookingItem.extraChargeAmount = ec;
                                            bookingItem.paidAmount = paid;
                                            bookingItem.balanceAmount = (paid - rc - ec);
                                        });

                                        roomChargesSummary.push({
                                            groupId: 2,
                                            groupName: 'Revenue',
                                            subGroupId: 1,
                                            subGroupName: 'Room Charge',
                                            parameterId: 2,
                                            parameterName: 'Room Charge',
                                            rooms: 0,
                                            amount: 0,
                                            isHourly: false,
                                            bookedRooms: []
                                        });
                                        roomChargesSummary.push({
                                            groupId: 2,
                                            groupName: 'Revenue',
                                            subGroupId: 1,
                                            subGroupName: 'Room Charge',
                                            parameterId: 3,
                                            parameterName: 'Hourly Charge',
                                            rooms: 0,
                                            amount: 0,
                                            isHourly: true,
                                            bookedRooms: []
                                        });

                                        $.each(roomCharges, function (ind, rcItem) {
                                            var normalRate = 0, rate = 0, adult = 0, child = 0, extraAdult = 0, extraChild = 0, rateDiff = 0;
                                            if (rcItem.adult > rcItem.bookedRoom.data.roomType.data.adult) {
                                                adult = rcItem.adult - rcItem.bookedRoom.data.roomType.data.adult;
                                            }
                                            if (rcItem.child > rcItem.bookedRoom.data.roomType.data.child) {
                                                child = rcItem.child - rcItem.bookedRoom.data.roomType.data.child;
                                            }
                                            if (rcItem.bookedRoom.data.rateType.data && rcItem.bookedRoom.data.rateType.data.roomTypeRate) {
                                                $.each(rcItem.bookedRoom.data.rateType.data.roomTypeRate, function (rtrInd, rtRate) {
                                                    if (rtRate.roomType) {
                                                        if (rcItem.bookedRoom.data.roomType.id === rtRate.roomType.id) {
                                                            rate = parseFloat(rtRate.rate);
                                                            extraAdult = parseFloat(rtRate.extraAdult);
                                                            extraChild = parseFloat(rtRate.extraChild);
                                                            return false;
                                                        }
                                                    }
                                                });
                                                normalRate = rate + adult * extraAdult + child * extraChild;
                                            }
                                            if (normalRate === 0) {
                                                normalRate = rcItem.totalAmount;
                                            }
                                            rcItem.normalRate = normalRate;
                                            rcItem.rateDiff = (normalRate - rcItem.totalAmount);
                                            rcTotalAmount += parseFloat(rcItem.calculatedTotal);
                                            if (rcItem.isHourly === true) {
                                                roomChargesSummary[1].amount += rcItem.calculatedTotal;
                                                if (roomChargesSummary[1].bookedRooms.length === 0 || findByBookingIdRefId(rcItem.booking_id, rcItem.refId, roomChargesSummary[1].bookedRooms) === -1) {
                                                    roomChargesSummary[1].bookedRooms.push(rcItem.bookedRoom.data);
                                                    roomChargesSummary[1].rooms++;
                                                }
                                            }
                                            else {
                                                roomChargesSummary[0].amount += rcItem.calculatedTotal;
                                                if (roomChargesSummary[0].bookedRooms.length === 0 || findByBookingIdRefId(rcItem.booking_id, rcItem.refId, roomChargesSummary[0].bookedRooms) === -1) {
                                                    roomChargesSummary[0].bookedRooms.push(rcItem.bookedRoom.data);
                                                    roomChargesSummary[0].rooms++;
                                                }
                                            }
                                        });

                                        $.each(extraCharges, function (ind, ecItem) {
                                            ecTotalAmount += parseFloat(ecItem.calculatedTotal);
                                            var isNew = false, existingInd = -1, isNew1 = false, existingInd1 = -1;
                                            var newItem = {
                                                groupId: 2,
                                                groupName: 'Revenue',
                                                subGroupId: 2,
                                                subGroupName: 'Extra Charge',
                                                parameterId: (ecItem.itemGroupId) ? ecItem.itemGroupId : (ind + 1),
                                                parameterName: ecItem.itemGroup,
                                                rooms: 1,
                                                amount: parseFloat(ecItem.calculatedTotal),
                                                bookedRooms: []
                                            };
                                            newItem.bookedRooms.push(ecItem.bookedRoom.data);
                                            var newItem1 = {
                                                groupId: (ecItem.itemGroupId) ? ecItem.itemGroupId : (ind + 1),
                                                groupName: ecItem.itemGroup,
                                                itemId: ecItem.itemId,
                                                itemName: ecItem.itemName,
                                                unitPrice: parseFloat(ecItem.calculatedTotal) / parseFloat(ecItem.quantity),
                                                quantity: parseFloat(ecItem.quantity),
                                                amount: parseFloat(ecItem.calculatedTotal)
                                            };

                                            if (extraChargeSummary.length === 0) {
                                                isNew = true;
                                            }
                                            else {
                                                existingInd = extraChargeSummary.findIndex(x => x.parameterName === ecItem.itemGroup);
                                                if (existingInd === -1) { isNew = true; }
                                                else {
                                                    extraChargeSummary[existingInd].amount += parseFloat(ecItem.calculatedTotal);
                                                    var bookingInd = findByBookingIdRefId(ecItem.booking_id, ecItem.refId, extraChargeSummary[existingInd].bookedRooms);
                                                    if (bookingInd === -1) {
                                                        extraChargeSummary[existingInd].rooms++;
                                                        extraChargeSummary[existingInd].bookedRooms.push(ecItem.bookedRoom.data);
                                                    }
                                                }
                                            }
                                            if (isNew === true) { extraChargeSummary.push(newItem); }

                                            if (extraChargeSummary1.length === 0) {
                                                isNew1 = true;
                                            }
                                            else {
                                                existingInd1 = extraChargeSummary1.findIndex(x => x.groupName === ecItem.itemGroup && x.itemName === ecItem.itemName);
                                                if (existingInd1 === -1) { isNew1 = true; }
                                                else {
                                                    extraChargeSummary1[existingInd1].quantity += parseFloat(ecItem.quantity);
                                                    extraChargeSummary1[existingInd1].amount += parseFloat(ecItem.calculatedTotal);
                                                    extraChargeSummary1[existingInd1].unitPrice = extraChargeSummary1[existingInd1].amount / extraChargeSummary1[existingInd1].quantity;
                                                }
                                            }
                                            if (isNew1 === true) { extraChargeSummary1.push(newItem1); }
                                        });

                                        $.each(payments, function (ind, payItem) {
                                            var isNew = false, existInd = -1;
                                            var newItem = {};
                                            var subId = 1;
                                            var name1 = payItem.paymentMethod.data.name;
                                            switch (payItem.paymentType) {
                                                case "cash":
                                                    paidAmount += parseFloat(payItem.amountCalculated);
                                                    newItem = {
                                                        groupId: 3,
                                                        groupName: "Income",
                                                        subGroupId: 1,
                                                        subGroupName: "Daily Income",
                                                        parameterId: (payItem.paymentMethod.id) ? payItem.paymentMethod.id : (ind + 1),
                                                        parameterName: (payItem.currency.data.isBase === true) ? payItem.paymentMethod.data.name : payItem.paymentMethod.data.name + "(" + payItem.currency.data.code + ")",
                                                        currencyCode: payItem.currency.data.code,
                                                        paidAmount: payItem.paidAmount,
                                                        paidAmountCalculated: payItem.amountCalculated,
                                                        rooms: 1,
                                                        bookedRooms: []
                                                    };
                                                    name1 = (payItem.currency.data.isBase === true) ? payItem.paymentMethod.data.name : payItem.paymentMethod.data.name + "(" + payItem.currency.data.code + ")";
                                                    break;
                                                case "bank":
                                                    paidAmount += parseFloat(payItem.amountCalculated);
                                                    newItem = {
                                                        groupId: 3,
                                                        groupName: "Income",
                                                        subGroupId: 1,
                                                        subGroupName: "Daily Income",
                                                        parameterId: (payItem.paymentMethod.id) ? payItem.paymentMethod.id : (ind + 1),
                                                        parameterName: payItem.paymentMethod.data.name,
                                                        currencyCode: payItem.currency.data.code,
                                                        paidAmount: payItem.paidAmount,
                                                        paidAmountCalculated: payItem.amountCalculated,
                                                        rooms: 1,
                                                        bookedRooms: []
                                                    };
                                                    break;
                                                case "invoice":
                                                    invoiceAmount += parseFloat(payItem.amountCalculated);
                                                    newItem = {
                                                        groupId: 3,
                                                        groupName: "Income",
                                                        subGroupId: 2,
                                                        subGroupName: "Invoice",
                                                        parameterId: (payItem.paymentMethod.id) ? payItem.paymentMethod.id : (ind + 1),
                                                        parameterName: payItem.paymentMethod.data.name,
                                                        currencyCode: payItem.currency.data.code,
                                                        paidAmount: payItem.paidAmount,
                                                        paidAmountCalculated: payItem.amountCalculated,
                                                        rooms: 1,
                                                        bookedRooms: []
                                                    };
                                                    subId = 2;
                                                    break;
                                            }
                                            newItem.bookedRooms.push(payItem.bookedRoom.data);
                                            if (paymentsSummary.length === 0) {
                                                isNew = true;
                                            }
                                            else {
                                                existInd = paymentsSummary.findIndex(x => x.subGroupId === subId && x.parameterName === name1);
                                                if (existInd === -1) { isNew = true; }
                                                else {
                                                    paymentsSummary[existInd].paidAmount += payItem.paidAmount;
                                                    paymentsSummary[existInd].paidAmountCalculated += payItem.amountCalculated;
                                                    var bookingInd = findByBookingIdRefId(payItem.booking_id, payItem.refId, paymentsSummary[existInd].bookedRooms);
                                                    if (bookingInd === -1) {
                                                        paymentsSummary[existInd].rooms++;
                                                        paymentsSummary[existInd].bookedRooms.push(payItem.bookedRoom.data);
                                                    }
                                                }
                                            }
                                            if (isNew === true) {
                                                paymentsSummary.push(newItem);
                                            }
                                        });

                                        revenueTotal = rcTotalAmount + ecTotalAmount;
                                        _deferred.resolve({
                                            checkedIn: bookingCheckedIn,
                                            checkedOut: bookingCheckedOut,
                                            extraCharges: extraCharges,
                                            roomCharges: roomCharges,
                                            extraChargeSummary: extraChargeSummary,
                                            extraChargeSummary1: extraChargeSummary1,
                                            roomChargesSummary: roomChargesSummary,
                                            payments: payments,
                                            paymentsSummary: paymentsSummary,
                                            rcTotalAmount: rcTotalAmount,
                                            ecTotalAmount: ecTotalAmount,
                                            revenueTotal: revenueTotal,
                                            paidAmount: paidAmount,
                                            invoiceAmount: invoiceAmount,
                                            totalPaid: (paidAmount + invoiceAmount)
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

            return _deferred.promise();
        }
    });
})();