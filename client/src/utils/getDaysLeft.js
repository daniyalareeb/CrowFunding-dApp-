export default (deadline) => {
    const deadlineMs = deadline * 1000;
    const currentTime = new Date().getTime();
    const remainingTime = deadlineMs - currentTime;
    const remainingDays = remainingTime / (1000 * 3600 * 24);
    return Math.ceil(remainingDays);
}