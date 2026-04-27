
import java.util.Scanner;

public class Bmi {

    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        System.out.println("--- BMI Calculator---");

        System.out.print("Enter weight in kilograms: ");
        double weight = input.nextDouble();

        System.out.print("Enter height in meters: ");
        double height = input.nextDouble();

        double bmi = weight / (height * height);

        System.out.printf("Your BMI is: %.2f%n", bmi);

        if (bmi < 18.5) {
            System.out.println("Category: Underweight");
        } else if (bmi < 25) {
            System.out.println("Category: Normal weight");
        } else if (bmi < 30) {
            System.out.println("Category: Overweight");
        } else {
            System.out.println("Category: Obese");
        }

        input.close();
    }
}
