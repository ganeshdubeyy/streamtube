export const formatDuration = (duration) => {
  let hour = duration.match(/(\d+)H/)?.[1];
  let minute = duration.match(/(\d+)M/)?.[1];
  let second = duration.match(/(\d+)S/)?.[1].padStart(2, "0");

  return `${hour ? hour + " : " : ""}${minute ? minute : ""} ${second ?  " : " + second  : ''}`;
};

export const formatView = (views) => {
  const viewsNum = Number(views);
  if (viewsNum < 1000) return viewsNum;
  else if (viewsNum < 1000000) {
    return Number((viewsNum / 1000).toFixed(1)) + "K";
  } else if (viewsNum < 1000000000) {
    return Number((viewsNum / 1000000).toFixed(1)) + "M";
  } else {
    return Number((viewsNum / 1000000000).toFixed(1)) + "B";
  }
};

export const formatPastInfo = (ISOString) => {
  let today = new Date();
  let publishedDate = new Date(ISOString);
  let difference = today - publishedDate;

  let seconds = Math.floor(difference / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  let weeks = Math.floor(days / 7);
  let months = Math.floor(days / 30);
  let years = Math.floor(days / 365);

  if (seconds < 60) {
    return seconds + " seconds ago";
  } else if (minutes < 60) {
    return minutes + " minutes ago";
  } else if (hours < 24) {
    return hours + " hours ago";
  } else if (days < 7) {
    return days + " days ago";
  } else if (days < 30) {
    return weeks + " weeks ago";
  } else if (days < 365) {
    return months + " months ago";
  } else {
    return years + " years ago";
  }
};