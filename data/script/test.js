$(document).ready(function () {
  if (!data.currentDate) {
    data.currentDate = abp.timing.convertToUserTimezone(moment()).format();
  }
});

$(".btnPayment").on("click", function () {
  if (!data.modalOpen || data.modalOpen === false) {
    var _depositModal = app.StartTaskModal();
    var formData = {
      bookingId: data.bookingId,
      balance: parseFloat(data.totalAmount) - parseFloat(data.totalPaid),
      totalCharge: parseFloat(data.totalAmount),
      totalPaid: parseFloat(data.totalPaid),
      bills: data.bills,
      billPays: data.billPays,
      refId: data.refId,
      room: data.room,
      userId: data.userId,
      userName: data.userName,
      currentDate: abp.timing.convertToUserTimezone(data.currentDate),
      workingDate: abp.timing.convertToUserTimezone(data.workingDate),
    };
    if (!data.modalOpen || data.modalOpen === false) {
      data.modalOpen = true;
      _depositModal.open({
        appCode: "DT01",
        formData: JSON.stringify(formData),
      });
    }
    _depositModal.onClose(function () {
      data.modalOpen = false;
      data.reload = false;
      instance.triggerChange();
    });
  }
});

$(document)
  .off("click", ".BillDetail")
  .on("lick", ".BillDetail", function () {});

$(".btnBillDetail").on("click", function () {
  if (!data.modalOpen || data.modalOpen === false) {
    var _totalAmountModal = app.StartTaskModal();
    var formData = {
      bookingId: data.bookingId,
      refId: data.refId,
      billPays: data.billPays,
      bills: data.bills,
      room: data.room,
      roomType: data.roomType,
      rateType: data.rateType,
      modalOptions: { hideSaveButton: true, modalSize: "xl" },
    };
    if (!data.modalOpen || data.modalOpen === false) {
      data.modalOpen = true;
      _totalAmountModal.open({
        appCode: "BD01",
        formData: JSON.stringify(formData),
      });
      _totalAmountModal.onClose(function () {
        data.modalOpen = false;
        data.reload = false;
        instance.triggerChange();
      });
    }
  }
});
