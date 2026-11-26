function defaultActivity(date) {
  return {
    date,
    kegel: 'No',
    sleepTime: '11 PM',
    wakeUpTime: '6:30 AM',
    laptopDropTime: '10 PM',
    gymOrSports: true,
    practicedGuitar: true,
    plannedTomorrow: false,
  };
}

function gymOrSportsValue(activity) {
  if (typeof activity.gymOrSports === 'boolean') return activity.gymOrSports;
  const legacyAnswers = [activity.gymTime, activity.sportPlayed].filter(Boolean);
  if (legacyAnswers.length === 0) return undefined;
  return legacyAnswers.some((answer) => !/^(?:❌|no\b)/i.test(answer));
}

module.exports = { defaultActivity, gymOrSportsValue };
