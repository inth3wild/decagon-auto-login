# decagon-auto-login
### Val[.]town script format
```
import axios from "npm:axios";
import process from "node:process";

type getDateReturn = {
  timeString: string;
  dateString: string;
};

type loginReturn = {
  accessToken: string;
  currentDate: {
    timeString: string;
    dateString: string;
  };
};

const axiosInstance = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
  },
});

// Get current date
function getDate(): getDateReturn {
  const localeDate = new Date().toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    timeStyle: "short",
    hour12: true,
    dateStyle: "medium",
  });

  let [dateString, timeString] = localeDate.split(",");
  timeString = timeString
    .replace(/am|pm/gi, (match) => match.toUpperCase())
    .trim();

  return { timeString, dateString };
}

// Sends request to login
async function login(): Promise<loginReturn> {
  try {
    const response = await axiosInstance.post(
      "/rest-api/oauth/access_token",
      {
        grant_type: "password",
        client_id: "TalentPlus",
        client_secret: process.env.CLIENT_SECRET,
        username: process.env.LOGIN_USERNAME,
        password: process.env.PASSWORD,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const accessToken = response.data.access_token;

    // Get current date
    const currentDate = getDate();

    return { accessToken, currentDate };
  } catch (error: any) {
    throw new Error(`Login error: ${error}`);
  }
}

// Sends request to get my points
async function getPoints(accessToken: string): Promise<number> {
  try {
    const response = await axiosInstance.get("/rest-api/v1/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(response.data["_data"].points);
    return response.data["_data"].points;
  } catch (error: any) {
    throw new Error(`Get points error: ${error}`);
  }
}

// Sends slack notification
async function sendSlackNotification(
  points: number,
  currentDate: getDateReturn
): Promise<void> {
  const { timeString, dateString } = currentDate;
  try {
    await axiosInstance.post(
      process.env.SLACK_WEBHOOK_URL!,
      {
        text: `
        Logged in at ${timeString} on ${dateString}\nTotal points: ${points}
        `,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    throw new Error(`Send notification error: ${error}`);
  }
}

// Start the script
export default async function main() {
  try {
    const { accessToken, currentDate } = await login();

    // Call getPoints()
    const points = await getPoints(accessToken);

    // Send slack notification
    await sendSlackNotification(points, currentDate);
  } catch (error) {
    console.error(error);
  }
}
main();
```
