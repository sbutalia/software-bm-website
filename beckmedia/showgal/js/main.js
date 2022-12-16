(function() {

  // Image replacement handler
  $(document).on("click", ".js-button", function() {
    var imageSrc = $(this).parents(".grid-item").find("img").attr("src");
    $(".js-download").attr("href", imageSrc);
    $(".js-modal-image").attr("src", imageSrc);
    $(document).on("click", ".js-heart", function() {
      $(this).toggleClass("active");
    });
  });
})();
