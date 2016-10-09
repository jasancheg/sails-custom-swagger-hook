// Swagger UI uses jQuery,
// so there is not problem with to use it here
$(document).ready(function() {

  // Change page title
  $("title").text("App Name");

  // Change logo link
  $("#logo").attr(
    'href',
    document.location.protocol + '//' + document.location.host
  );

  // Change brand text
  $(".logo__title").text("App name");

  // Change logo image
  // all files added to the folder with custom files
  // is public in /api/docs/{path to file}
  // also you can use the assets folder provided by sails
  // to store an image or point to an external file
  $(".logo__img").attr({
    alt: "App name",
    height: "30",
    width: "30",
    src: "smile.png"
  });

});
