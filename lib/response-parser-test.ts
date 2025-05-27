// Utility to test different response formats
export function testResponseParsing() {
  const testResponses = [
    // Expected format
    [{ output: "Hello! I'm here to help you with your pet care needs." }],

    // List format
    [
      {
        output:
          "Here are the services we offer:\n\n1. Dog walking\n2. Pet grooming\n3. Veterinary checkups\n4. Pet sitting\n\nWhich service are you interested in?",
      },
    ],

    // Bullet points
    [
      {
        output:
          "Benefits of regular grooming:\n\n• Reduces shedding\n• Prevents matting\n• Allows early detection of skin issues\n• Keeps your pet comfortable",
      },
    ],

    // With links
    [
      {
        output:
          "You can book an appointment here: https://critter.pet/booking\n\nOr view our services here: https://critter.pet/services",
      },
    ],

    // Appointment details
    [
      {
        output:
          "Your appointment details:\n\nDate: June 15, 2023\nTime: 2:30 PM\nService: Dog Grooming\n\nPlease arrive 10 minutes early.",
      },
    ],
  ]

  console.log("Testing response parsing...")

  testResponses.forEach((response, index) => {
    console.log(`Test ${index + 1}:`, response)
    try {
      const parsed = parseTestResponse(response)
      console.log(`Parsed:`, parsed)
      console.log("---")
    } catch (error) {
      console.error(`Error parsing test ${index + 1}:`, error)
    }
  })
}

function parseTestResponse(response: any): string {
  if (Array.isArray(response) && response.length > 0 && response[0].output) {
    return response[0].output.replace(/\\n/g, "\n").trim()
  }
  throw new Error("Invalid format")
}
