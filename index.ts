import axios from "axios";
import "dotenv/config";

type getDateReturn = {
  time: string;
  dateString: string;
};

const axiosInstance = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
  },
  //   proxy: {
  //     protocol: "http",
  //     host: "127.0.0.1",
  //     port: 8080,
  //   },
});

// Get current date
function getDate(): getDateReturn {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60000; // convert to milliseconds
  const nigeriaTime = new Date(date.getTime() + timezoneOffset + 3600000); // add 1 hour for en-NG

  const time = nigeriaTime
    .toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/am|pm/gi, (match) => match.toUpperCase());

  const dateString = date
    .toLocaleDateString("en-NG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replaceAll("/", "-");

  return { time, dateString };
}

// Sends request to login
async function login(): Promise<void> {
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

    // Call getPoints()
    const points = await getPoints(accessToken);

    // Send slack notification
    await sendSlackNotification(points as number, currentDate);
  } catch (error: any) {
    console.error("Login error: ", error);
  }
}

// Sends request to get my points
async function getPoints(accessToken: string): Promise<number | void> {
  try {
    const response = await axiosInstance.get("/rest-api/v1/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(response.data["_data"].points);
    return response.data["_data"].points;
  } catch (error: any) {
    console.error("Get points error: ", error);
    return;
  }
}

// Sends slack notification
async function sendSlackNotification(
  points: number,
  currentDate: getDateReturn
) {
  const { time, dateString } = currentDate;
  try {
    await axiosInstance.post(
      process.env.SLACK_WEBHOOK_URL!,
      {
        text: `
        Logged in at ${time} on ${dateString}\nTotal points: ${points}
        `,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Send notification error: ", error);
  }
}

// Start the script
export default async function main() {
  await login();
}
main();
