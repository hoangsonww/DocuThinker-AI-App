#!/usr/bin/env python
import argparse
import os
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np


def load_data(file_path: str) -> pd.DataFrame:
    """
    Load data from a CSV file into a pandas DataFrame.
    """
    try:
        df = pd.read_csv(file_path)
        return df
    except Exception as e:
        print(f"Error loading data from {file_path}: {e}")
        raise e


def plot_line_chart(df: pd.DataFrame, x_column: str, y_column: str, title: str = "Line Chart", output_file: str = None):
    """
    Plot a line chart using the specified x and y columns.
    """
    plt.figure()
    plt.plot(df[x_column], df[y_column])
    plt.xlabel(x_column)
    plt.ylabel(y_column)
    plt.title(title)
    plt.grid(True)
    if output_file:
        plt.savefig(output_file)
    plt.show()


def plot_bar_chart(df: pd.DataFrame, x_column: str, y_column: str, title: str = "Bar Chart", output_file: str = None):
    """
    Plot a bar chart using the specified x and y columns.
    """
    plt.figure()
    plt.bar(df[x_column], df[y_column])
    plt.xlabel(x_column)
    plt.ylabel(y_column)
    plt.title(title)
    if output_file:
        plt.savefig(output_file)
    plt.show()


def plot_scatter_chart(df: pd.DataFrame, x_column: str, y_column: str, title: str = "Scatter Chart",
                       output_file: str = None):
    """
    Plot a scatter chart using the specified x and y columns.
    """
    plt.figure()
    plt.scatter(df[x_column], df[y_column])
    plt.xlabel(x_column)
    plt.ylabel(y_column)
    plt.title(title)
    plt.grid(True)
    if output_file:
        plt.savefig(output_file)
    plt.show()


def plot_histogram(df: pd.DataFrame, column: str, bins: int = 10, title: str = "Histogram", output_file: str = None):
    """
    Plot a histogram for the specified column.
    """
    plt.figure()
    plt.hist(df[column], bins=bins, edgecolor='black')
    plt.xlabel(column)
    plt.ylabel("Frequency")
    plt.title(title)
    if output_file:
        plt.savefig(output_file)
    plt.show()


def plot_pie_chart(df: pd.DataFrame, column: str, title: str = "Pie Chart", output_file: str = None):
    """
    Plot a pie chart showing the distribution of values in the specified column.
    """
    data = df[column].value_counts()
    plt.figure()
    plt.pie(data.values, labels=data.index, autopct='%1.1f%%', startangle=90)
    plt.title(title)
    plt.axis('equal')
    if output_file:
        plt.savefig(output_file)
    plt.show()


def plot_multiple_charts(df: pd.DataFrame, output_dir: str = None):
    """
    Create a 2x2 grid of plots: a line chart, a bar chart (if categorical data exists),
    a scatter chart, and a histogram.
    """
    fig, axs = plt.subplots(2, 2, figsize=(12, 10))

    # Determine numeric and categorical columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object']).columns

    # Line Chart (if at least two numeric columns)
    if len(numeric_cols) >= 2:
        axs[0, 0].plot(df[numeric_cols[0]], df[numeric_cols[1]])
        axs[0, 0].set_title("Line Chart")
        axs[0, 0].set_xlabel(numeric_cols[0])
        axs[0, 0].set_ylabel(numeric_cols[1])
        axs[0, 0].grid(True)
    else:
        axs[0, 0].text(0.5, 0.5, 'Not enough numeric data for line chart', ha='center')

    # Bar Chart (using first categorical column if exists)
    if len(categorical_cols) > 0:
        data = df[categorical_cols[0]].value_counts()
        axs[0, 1].bar(data.index, data.values)
        axs[0, 1].set_title("Bar Chart")
        axs[0, 1].set_xlabel(categorical_cols[0])
        axs[0, 1].set_ylabel("Frequency")
    else:
        axs[0, 1].text(0.5, 0.5, 'No categorical data found', ha='center')
        axs[0, 1].set_title("Bar Chart")

    # Scatter Chart (if at least two numeric columns)
    if len(numeric_cols) >= 2:
        axs[1, 0].scatter(df[numeric_cols[0]], df[numeric_cols[1]])
        axs[1, 0].set_title("Scatter Chart")
        axs[1, 0].set_xlabel(numeric_cols[0])
        axs[1, 0].set_ylabel(numeric_cols[1])
        axs[1, 0].grid(True)
    else:
        axs[1, 0].text(0.5, 0.5, 'Not enough numeric data for scatter chart', ha='center')

    # Histogram (using first numeric column)
    if len(numeric_cols) >= 1:
        axs[1, 1].hist(df[numeric_cols[0]], bins=10, edgecolor='black')
        axs[1, 1].set_title("Histogram")
        axs[1, 1].set_xlabel(numeric_cols[0])
        axs[1, 1].set_ylabel("Frequency")
    else:
        axs[1, 1].text(0.5, 0.5, 'No numeric data for histogram', ha='center')

    plt.tight_layout()
    if output_dir:
        output_file = os.path.join(output_dir, "multiple_charts.png")
        plt.savefig(output_file)
    plt.show()


def main():
    parser = argparse.ArgumentParser(description="Comprehensive Data Visualization Script")
    parser.add_argument("csv_file", help="Path to CSV file containing data")
    parser.add_argument("--chart", choices=["line", "bar", "scatter", "histogram", "pie", "multiple"],
                        default="multiple", help="Type of chart to plot")
    parser.add_argument("--x", help="Column name for x-axis (for line, bar, scatter)")
    parser.add_argument("--y", help="Column name for y-axis (for line, bar, scatter)")
    parser.add_argument("--column", help="Column name for histogram or pie chart")
    parser.add_argument("--bins", type=int, default=10, help="Number of bins for histogram")
    parser.add_argument("--output_dir", help="Directory to save plot image", default=None)
    args = parser.parse_args()

    df = load_data(args.csv_file)

    if args.chart == "line":
        if not args.x or not args.y:
            print("For line chart, provide both --x and --y column names.")
            return
        plot_line_chart(df, args.x, args.y, title="Line Chart", output_file=None)
    elif args.chart == "bar":
        if not args.x or not args.y:
            print("For bar chart, provide both --x and --y column names.")
            return
        plot_bar_chart(df, args.x, args.y, title="Bar Chart", output_file=None)
    elif args.chart == "scatter":
        if not args.x or not args.y:
            print("For scatter chart, provide both --x and --y column names.")
            return
        plot_scatter_chart(df, args.x, args.y, title="Scatter Chart", output_file=None)
    elif args.chart == "histogram":
        if not args.column:
            print("For histogram, provide --column name.")
            return
        plot_histogram(df, args.column, bins=args.bins, title="Histogram", output_file=None)
    elif args.chart == "pie":
        if not args.column:
            print("For pie chart, provide --column name.")
            return
        plot_pie_chart(df, args.column, title="Pie Chart", output_file=None)
    elif args.chart == "multiple":
        plot_multiple_charts(df, output_dir=args.output_dir)
    else:
        print("Invalid chart type specified.")


if __name__ == "__main__":
    main()
