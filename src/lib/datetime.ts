/** format a date relative to the current time */
export function formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if(diffDays > 1) {
        return `in ${diffDays} days`;
    } else if(diffDays > 1) {
        return "tomorrow";
    } else if(diffDays === 1) {
        return `in 1d ${diffHours - 24}h`
    } else if(diffDays === 0) {
        if(diffHours > 1) return `in ${diffHours} hours`;
        else if(diffHours === 1) return "in an hour";
        else if(diffMinutes > 1) return `in ${diffMinutes} minutes`;
        else if(diffMinutes === 1) return "in a minute";
        else return "just now";
    } else if(diffDays === -1) {
        if(diffHours > -23) return `${-diffHours}h ago`;
        else return "yesterday";
    } else {
        return `${-diffDays} days ago`;
    }
}